#!/usr/bin/env bash
#
# Диагностика «FlowLocal не работает».
# Собирает всё, что нужно, чтобы понять, на каком этапе ломается цепочка.
#
# Запуск из корня FlowLocal:  ./scripts/diagnose.sh

set -uo pipefail

BUNDLE_ID="local.flowlocal.app"
APP="/Applications/FlowLocal.app"
MODELS_DIR="$HOME/Library/Application Support/FlowLocal/models"

ok()   { echo "  [OK]   $*"; }
bad()  { echo "  [ПРОБЛЕМА] $*"; }
info() { echo "  ·      $*"; }

echo "==================================================="
echo " FlowLocal — диагностика"
echo " $(date '+%Y-%m-%d %H:%M:%S')   macOS $(sw_vers -productVersion)   $(uname -m)"
echo "==================================================="

# --- 1. Процесс -----------------------------------------------------------
echo
echo "[1] Процесс"
if pgrep -x FlowLocal >/dev/null; then
    ok "запущен, PID $(pgrep -x FlowLocal | tr '\n' ' ')"
else
    bad "НЕ запущен. Запустите: open $APP"
fi

# --- 2. Конфликтующие приложения -----------------------------------------
echo
echo "[2] Конфликты за клавишу Fn"
CONFLICT=0
# Голый «Flow» здесь недопустим: pgrep -f матчит подстроку во всей командной
# строке, поэтому под него попадают сам FlowLocal, системный
# intelligencecontextd (IntelligenceFlowContextRuntime) и рендереры Electron
# с флагом ReplacedNormalFlowStackingInlinePaint. Wispr Flow ловится
# паттернами ниже.
for name in "Wispr Flow" WisprFlow superwhisper VoiceInk Karabiner-Elements karabiner_grabber MacWhisper Raycast; do
    if pgrep -f "$name" >/dev/null 2>&1; then
        bad "запущен «${name}» — может перехватывать ту же клавишу"
        CONFLICT=1
    fi
done
[ "$CONFLICT" -eq 0 ] && ok "конкурентов не обнаружено"

# --- 3. Подпись и устойчивость разрешений --------------------------------
echo
echo "[3] Подпись приложения"
#
# База TCC (кому что разрешено) закрыта SIP и НЕ читается без Full Disk
# Access — программно статус разрешений получить нельзя. Но можно проверить
# то, что определяет, СОХРАНЯТСЯ ли выданные разрешения при пересборке:
# тип подписи.
#
SIGN_INFO=$(codesign -dv --verbose=4 "$APP" 2>&1)
AUTHORITY=$(echo "$SIGN_INFO" | grep '^Authority=' | head -1 | cut -d= -f2-)
CDHASH=$(echo "$SIGN_INFO" | grep '^CDHash=' | cut -d= -f2)

if [ -z "$AUTHORITY" ]; then
    bad "подпись AD-HOC (без сертификата)"
    info "cdhash: ${CDHASH:-неизвестен}"
    echo
    info "ЭТО И ЕСТЬ ПРИЧИНА ПОСТОЯННОГО СБРОСА РАЗРЕШЕНИЙ."
    info "TCC привязывает разрешения ad-hoc программы к cdhash, а он"
    info "меняется при каждой пересборке — macOS считает приложение новым"
    info "и отзывает доступ, оставляя галочку в настройках включённой."
    echo
    info "Лечится один раз:   ./scripts/setup-signing.sh"
    info "затем:              ./scripts/update-app.sh"
else
    ok "подписано сертификатом: $AUTHORITY"
    info "cdhash: ${CDHASH:-неизвестен}"
    info "разрешения должны сохраняться при пересборках"
fi

echo
echo "[3b] Разрешения — проверьте ГЛАЗАМИ (программно нельзя, база под SIP)"
info "Системные настройки → Конфиденциальность и безопасность:"
info "  • Микрофон             → FlowLocal включён?"
info "  • Универсальный доступ → FlowLocal включён?"
info "  • Мониторинг ввода     → FlowLocal включён?"
echo
info "Если галочка стоит, а диктовка не работает — галочке НЕ верьте."
info "Выделите FlowLocal → «−» (удалить) → «+» → $APP"
info "и перезапустите приложение. Просто снять/поставить галочку мало."

# --- 4. Настройки ---------------------------------------------------------
echo
echo "[4] Сохранённые настройки"
KEY=$(defaults read "$BUNDLE_ID" hotkeyKey 2>/dev/null)
MODE=$(defaults read "$BUNDLE_ID" hotkeyMode 2>/dev/null)
MODEL=$(defaults read "$BUNDLE_ID" model 2>/dev/null)
LANG=$(defaults read "$BUNDLE_ID" language 2>/dev/null)
info "клавиша:  ${KEY:-<не задана, значит по умолчанию fn>}"
info "режим:    ${MODE:-<не задан, значит hold>}"
info "модель:   ${MODEL:-<не задана, значит large-v3-turbo>}"
info "язык:     ${LANG:-<не задан, значит auto>}"

# --- 5. Модель ------------------------------------------------------------
echo
echo "[5] Модель Whisper"
if [ -d "$MODELS_DIR" ] && [ -n "$(ls -A "$MODELS_DIR" 2>/dev/null)" ]; then
    while read -r line; do ok "$line"; done < <(ls -lh "$MODELS_DIR" | tail -n +2 | awk '{print $9 "  " $5}')
else
    bad "моделей нет в $MODELS_DIR"
fi

# --- 6. Микрофон ----------------------------------------------------------
echo
echo "[6] Устройство ввода по умолчанию"
system_profiler SPAudioDataType 2>/dev/null \
    | awk '/Input Source|Устройство ввода|: *Default Input/{print "  · " $0}' | head -5
info "(если микрофона нет в списке — проверьте Системные настройки → Звук → Вход)"

# --- 7. Логи --------------------------------------------------------------
echo
echo "[7] Лог процесса за 10 минут"
LOGS=$(log show --last 10m --predicate "process == \"FlowLocal\"" --style compact 2>/dev/null | tail -30)
if [ -n "$LOGS" ]; then echo "$LOGS" | sed 's/^/  /'; else info "лог пуст"; fi

echo
echo "[8] Отчёты о падении за сутки"
CRASH=$(find ~/Library/Logs/DiagnosticReports -name 'FlowLocal*' -mtime -1 2>/dev/null)
if [ -n "$CRASH" ]; then bad "найдены:"; echo "$CRASH" | sed 's/^/       /'; else ok "падений нет"; fi

echo
echo "==================================================="
echo " Следующий шаг: запустите пробник клавиш"
echo "   swift scripts/probe-keys.swift"
echo " и нажмите Fn несколько раз — он покажет, доходит ли"
echo " эта клавиша до системы вообще."
echo "==================================================="
