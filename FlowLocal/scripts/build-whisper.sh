#!/usr/bin/env bash
#
# Собирает whisper.cpp (пиненая версия) со включённым Metal для Apple Silicon
# и пакует результат в Frameworks/whisper.xcframework, который подключён
# в Package.swift как binaryTarget.
#
# Требования: macOS (Apple Silicon), Xcode Command Line Tools, cmake, git.
#   brew install cmake
#
# Запуск из корня FlowLocal:  ./scripts/build-whisper.sh

set -euo pipefail

WHISPER_VERSION="v1.7.5"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR="$ROOT/vendor/whisper.cpp"
BUILD="$VENDOR/build-flowlocal"
OUT="$ROOT/Frameworks/whisper.xcframework"

echo "==> whisper.cpp $WHISPER_VERSION -> $OUT"

if [ ! -d "$VENDOR/.git" ]; then
    git clone --depth 1 --branch "$WHISPER_VERSION" \
        https://github.com/ggerganov/whisper.cpp.git "$VENDOR"
else
    (cd "$VENDOR" && git fetch --depth 1 origin "tag" "$WHISPER_VERSION" && git checkout "$WHISPER_VERSION")
fi

echo "==> cmake (static, Metal on, embedded metallib)"
cmake -S "$VENDOR" -B "$BUILD" \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_OSX_ARCHITECTURES=arm64 \
    -DBUILD_SHARED_LIBS=OFF \
    -DWHISPER_BUILD_EXAMPLES=OFF \
    -DWHISPER_BUILD_TESTS=OFF \
    -DGGML_METAL=ON \
    -DGGML_METAL_EMBED_LIBRARY=ON
cmake --build "$BUILD" --config Release -j "$(sysctl -n hw.ncpu)"

echo "==> объединяю статические библиотеки"
STAGE="$BUILD/stage"
rm -rf "$STAGE" && mkdir -p "$STAGE/include"

LIBS=$(find "$BUILD" -name '*.a')
echo "$LIBS"
# shellcheck disable=SC2086
libtool -static -o "$STAGE/libwhisper-combined.a" $LIBS

echo "==> заголовки и modulemap"
for h in \
    "$VENDOR/include/whisper.h" \
    "$VENDOR/ggml/include/ggml.h" \
    "$VENDOR/ggml/include/ggml-alloc.h" \
    "$VENDOR/ggml/include/ggml-backend.h" \
    "$VENDOR/ggml/include/ggml-cpu.h" \
    "$VENDOR/ggml/include/ggml-metal.h"
do
    [ -f "$h" ] && cp "$h" "$STAGE/include/"
done

cat > "$STAGE/include/module.modulemap" <<'EOF'
module whisper {
    header "whisper.h"
    header "ggml.h"
    link "c++"
    export *
}
EOF

echo "==> xcframework"
rm -rf "$OUT"
xcodebuild -create-xcframework \
    -library "$STAGE/libwhisper-combined.a" \
    -headers "$STAGE/include" \
    -output "$OUT"

echo "==> готово: $OUT"
echo "Теперь: swift build -c release  (или откройте Package.swift в Xcode)"
