#!/usr/bin/env bash
#
# Создаёт САМОПОДПИСАННЫЙ сертификат для подписи FlowLocal — один раз.
#
# Зачем. Ad-hoc подпись (codesign -s -) не имеет устойчивой идентичности:
# TCC привязывает выданные разрешения к cdhash бинарника, а он меняется при
# КАЖДОЙ пересборке. Поэтому после каждой установки macOS молча отзывает
# «Универсальный доступ» и «Мониторинг ввода» — галочка в настройках
# остаётся, а доступа фактически нет.
#
# С самоподписанным сертификатом подпись имеет постоянный designated
# requirement (identifier + сертификат), и разрешения переживают пересборки.
#
# Запуск (один раз):  ./scripts/setup-signing.sh
# Дальше update-app.sh подхватит сертификат автоматически.
#
# sudo НЕ требуется. Сертификат кладётся только в личную связку ключей
# пользователя и НЕ добавляется в системные доверенные корневые: для
# устойчивого designated requirement это не нужно, а доверенный корень
# заставил бы систему доверять всему, что им подписано.

set -euo pipefail

CERT_NAME="FlowLocal Self Signed"
KEYCHAIN="$HOME/Library/Keychains/login.keychain-db"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "=== Настройка постоянной подписи для FlowLocal ==="

# Уже есть?
if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo "[OK] Сертификат «${CERT_NAME}» уже существует — ничего делать не нужно."
    security find-identity -v -p codesigning | grep "$CERT_NAME" | sed 's/^/     /'
    exit 0
fi

echo "==> генерирую сертификат"
cat > "$TMP/openssl.cnf" <<'EOF'
[ req ]
distinguished_name = dn
x509_extensions    = ext
prompt             = no

[ dn ]
CN = FlowLocal Self Signed

[ ext ]
basicConstraints       = critical,CA:false
keyUsage               = critical,digitalSignature
extendedKeyUsage       = critical,codeSigning
1.2.840.113635.100.6.1.13 = DER:0500
EOF

openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
    -config "$TMP/openssl.cnf" \
    -keyout "$TMP/key.pem" -out "$TMP/cert.pem" 2>/dev/null

openssl pkcs12 -export -legacy \
    -inkey "$TMP/key.pem" -in "$TMP/cert.pem" \
    -out "$TMP/cert.p12" -passout pass:flowlocal 2>/dev/null \
  || openssl pkcs12 -export \
    -inkey "$TMP/key.pem" -in "$TMP/cert.pem" \
    -out "$TMP/cert.p12" -passout pass:flowlocal 2>/dev/null

echo "==> импортирую в связку ключей"
security import "$TMP/cert.p12" -k "$KEYCHAIN" -P flowlocal \
    -T /usr/bin/codesign -T /usr/bin/security >/dev/null

# Намеренно НЕ вызываем `security add-trusted-cert -r trustRoot`: это
# потребовало бы sudo и заставило систему доверять всему, что подписано этим
# сертификатом. Для нашей цели — чтобы TCC не сбрасывал разрешения при
# пересборке — достаточно того, что идентичность подписи постоянна.

# Разрешаем codesign пользоваться ключом без запроса пароля каждый раз.
security set-key-partition-list -S apple-tool:,apple:,codesign: \
    -s -k "" "$KEYCHAIN" >/dev/null 2>&1 || true

echo
if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo "[OK] Готово. Сертификат создан:"
    security find-identity -v -p codesigning | grep "$CERT_NAME" | sed 's/^/     /'
    echo
    echo "Теперь запустите ./scripts/update-app.sh — он подпишет приложение"
    echo "этим сертификатом. Разрешения выдайте ещё ОДИН раз (последний),"
    echo "дальше они будут сохраняться при всех пересборках."
else
    echo "[ПРОБЛЕМА] сертификат не появился в списке идентичностей." >&2
    exit 1
fi
