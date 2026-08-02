#!/usr/bin/env bash
#
# Обновление уже установленного FlowLocal одной командой:
#   1. резервная копия /Applications/FlowLocal.app с датой и временем;
#   2. Release-сборка под архитектуру этого Mac;
#   3. остановка старого процесса;
#   4. установка новой версии на то же место с тем же bundle id и подписью;
#   5. запуск и автоматические проверки.
#
# Модели и настройки не трогаются: они лежат в
#   ~/Library/Application Support/FlowLocal/models/
#   ~/Library/Preferences/local.flowlocal.app.plist
#
# Запуск из корня FlowLocal:  ./scripts/update-app.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BUNDLE_ID="local.flowlocal.app"
INSTALLED="/Applications/FlowLocal.app"
BACKUP_DIR="$HOME/FlowLocal-backups"
STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
BACKUP="$BACKUP_DIR/FlowLocal-$STAMP.app"
ARCH="$(uname -m)"
MODELS_DIR="$HOME/Library/Application Support/FlowLocal/models"

fail() { echo "ОШИБКА: $*" >&2; exit 1; }
ok()   { echo "  [OK] $*"; }
warn() { echo "  [!]  $*"; }

echo "=== FlowLocal update ($ARCH) ==="

# --- 0. Предусловия -------------------------------------------------------
[ -d "Frameworks/whisper.xcframework" ] \
    || fail "нет Frameworks/whisper.xcframework — сначала запустите ./scripts/build-whisper.sh"

# --- 1. Резервная копия ---------------------------------------------------
if [ -d "$INSTALLED" ]; then
    echo "==> резервная копия"
    mkdir -p "$BACKUP_DIR"
    # ditto сохраняет права, extended attributes и подпись.
    ditto "$INSTALLED" "$BACKUP"
    ok "сохранено: $BACKUP"
else
    warn "$INSTALLED не найден — установка «с нуля», резервировать нечего"
fi

# --- 2. Сборка ------------------------------------------------------------
echo "==> swift build -c release --arch $ARCH"
swift build -c release --arch "$ARCH"
BIN="$(swift build -c release --arch "$ARCH" --show-bin-path)/FlowLocal"
[ -x "$BIN" ] || fail "бинарник не собрался: $BIN"
ok "собрано: $BIN"

# --- 3. Остановка старого процесса ---------------------------------------
echo "==> останавливаю запущенный FlowLocal"
if pgrep -x FlowLocal >/dev/null 2>&1; then
    osascript -e 'tell application "FlowLocal" to quit' >/dev/null 2>&1 || true
    for _ in $(seq 1 10); do
        pgrep -x FlowLocal >/dev/null 2>&1 || break
        sleep 0.5
    done
    pgrep -x FlowLocal >/dev/null 2>&1 && pkill -x FlowLocal || true
    sleep 1
    ok "процесс остановлен"
else
    ok "процесс не был запущен"
fi

# --- 4. Установка ---------------------------------------------------------
echo "==> собираю бандл и устанавливаю в $INSTALLED"
STAGE="$ROOT/dist/FlowLocal.app"
rm -rf "$STAGE"
mkdir -p "$STAGE/Contents/MacOS" "$STAGE/Contents/Resources"
cp "$BIN" "$STAGE/Contents/MacOS/FlowLocal"
cp "$ROOT/Resources/Info.plist" "$STAGE/Contents/Info.plist"

# Тот же identifier, что и раньше — иначе macOS считает это другим приложением
# и сбрасывает уже выданные разрешения.
#
# Если есть самоподписанный сертификат (./scripts/setup-signing.sh) — подписываем
# им: у такой подписи устойчивая идентичность, и TCC не сбрасывает разрешения
# при пересборке. Иначе откатываемся на ad-hoc.
CERT_NAME="FlowLocal Self Signed"
if security find-identity -v -p codesigning 2>/dev/null | grep -q "$CERT_NAME"; then
    codesign --force --deep --sign "$CERT_NAME" --identifier "$BUNDLE_ID" \
             --options runtime "$STAGE"
    ok "подписано сертификатом «${CERT_NAME}» (разрешения переживут пересборку)"
else
    codesign --force --deep --sign - --identifier "$BUNDLE_ID" "$STAGE"
    warn "ad-hoc подпись: macOS будет сбрасывать разрешения при каждой пересборке."
    warn "Один раз выполните ./scripts/setup-signing.sh, чтобы это прекратилось."
fi

rm -rf "$INSTALLED"
ditto "$STAGE" "$INSTALLED"
ok "установлено: $INSTALLED"

# --- 5. Запуск ------------------------------------------------------------
echo "==> запускаю"
open "$INSTALLED"
sleep 4

# --- 6. Автоматические проверки ------------------------------------------
echo "==> проверки"
CHECKS_FAILED=0
check() {
    if eval "$2" >/dev/null 2>&1; then ok "$1"; else warn "$1 — НЕ ПРОЙДЕНО"; CHECKS_FAILED=$((CHECKS_FAILED+1)); fi
}

check "бандл на месте"                 "[ -d '$INSTALLED' ]"
check "подпись валидна"                "codesign --verify --deep '$INSTALLED'"
check "bundle id сохранён ($BUNDLE_ID)" "[ \"\$(defaults read '$INSTALLED/Contents/Info' CFBundleIdentifier)\" = '$BUNDLE_ID' ]"
check "LSUIElement включён (нет иконки в Dock)" "[ \"\$(defaults read '$INSTALLED/Contents/Info' LSUIElement)\" = '1' ]"
check "процесс запущен"                "pgrep -x FlowLocal"

echo "==> процесс живёт (проверка 6 секунд)"
sleep 6
check "процесс не упал"                "pgrep -x FlowLocal"

echo "==> модель и настройки"
if [ -d "$MODELS_DIR" ] && [ -n "$(ls -A "$MODELS_DIR" 2>/dev/null)" ]; then
    ok "модели на месте:"
    ls -lh "$MODELS_DIR" | tail -n +2 | awk '{print "       " $9 "  " $5}'
else
    warn "моделей нет в $MODELS_DIR — будут скачаны при первом запуске"
fi

PREFS="$HOME/Library/Preferences/$BUNDLE_ID.plist"
if [ -f "$PREFS" ]; then
    ok "настройки сохранены:"
    defaults read "$BUNDLE_ID" 2>/dev/null | sed 's/^/       /' || true
else
    warn "файла настроек ещё нет (появится после первого изменения настроек)"
fi

echo "==> крэши и ошибки за последние 5 минут"
CRASHES="$(find ~/Library/Logs/DiagnosticReports -name 'FlowLocal*' -mmin -5 2>/dev/null || true)"
if [ -n "$CRASHES" ]; then
    warn "найдены отчёты о падении:"; echo "$CRASHES" | sed 's/^/       /'
    CHECKS_FAILED=$((CHECKS_FAILED+1))
else
    ok "отчётов о падении нет"
fi

echo "--- лог приложения (последние 2 минуты) ---"
log show --last 2m --predicate 'process == "FlowLocal"' --style compact 2>/dev/null \
    | tail -40 || echo "  (лог пуст)"
echo "-------------------------------------------"

echo
if [ "$CHECKS_FAILED" -eq 0 ]; then
    echo "=== Готово. Все автоматические проверки пройдены. ==="
else
    echo "=== Готово, но $CHECKS_FAILED проверок не прошло (см. [!] выше). ==="
fi
echo "Резервная копия: ${BACKUP:-нет}"
echo
echo "Осталось проверить вручную: откройте Notes, зажмите Fn/🌐, скажите фразу, отпустите."
