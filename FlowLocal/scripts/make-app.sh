#!/usr/bin/env bash
#
# Собирает release-бинарник через SwiftPM и пакует в FlowLocal.app
# с Info.plist (LSUIElement, описание микрофона) и ad-hoc подписью.
#
# Запуск из корня FlowLocal:  ./scripts/make-app.sh
# Результат: dist/FlowLocal.app  → перетащите в /Applications.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d "Frameworks/whisper.xcframework" ]; then
    echo "Сначала соберите whisper: ./scripts/build-whisper.sh" >&2
    exit 1
fi

echo "==> swift build -c release"
swift build -c release --arch arm64

BIN="$(swift build -c release --arch arm64 --show-bin-path)/FlowLocal"
APP="$ROOT/dist/FlowLocal.app"

echo "==> пакую $APP"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN" "$APP/Contents/MacOS/FlowLocal"
cp "$ROOT/Resources/Info.plist" "$APP/Contents/Info.plist"

echo "==> ad-hoc подпись (стабильная идентичность для TCC-разрешений)"
codesign --force --deep --sign - --identifier local.flowlocal.app "$APP"

echo "==> готово: $APP"
echo "Переместите в /Applications и запустите. При первом запуске выдайте"
echo "разрешения: Микрофон, Универсальный доступ, Мониторинг ввода."
