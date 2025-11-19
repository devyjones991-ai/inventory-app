#!/bin/bash
# Скрипт для проверки DNS настроек

DOMAIN="multiminder.duckdns.org"
SERVER_IP="89.207.218.148"

echo "🔍 Проверка DNS для $DOMAIN"
echo ""

# Проверка A записи
echo "1. Проверка A записи:"
A_RECORD=$(dig +short $DOMAIN A 2>/dev/null || echo "")
if [ -z "$A_RECORD" ]; then
    echo "   ❌ A запись не найдена!"
    echo "   Действия:"
    echo "   1. Откройте https://www.duckdns.org"
    echo "   2. Войдите в свой аккаунт"
    echo "   3. Убедитесь, что домен multiminder настроен"
    echo "   4. Обновите IP на $SERVER_IP"
else
    echo "   ✓ A запись: $A_RECORD"
    if [ "$A_RECORD" = "$SERVER_IP" ]; then
        echo "   ✓ IP совпадает с сервером"
    else
        echo "   ⚠ IP не совпадает! Ожидается: $SERVER_IP"
        echo "   Обновите IP в DuckDNS"
    fi
fi

echo ""
echo "2. Проверка доступности домена:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://$DOMAIN" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "   ✓ Домен доступен (HTTP $HTTP_CODE)"
else
    echo "   ⚠ Домен недоступен (HTTP $HTTP_CODE)"
    echo "   Проверьте:"
    echo "   - Nginx работает: sudo systemctl status nginx"
    echo "   - Порт 80 открыт: sudo ufw status"
fi

echo ""
echo "3. Проверка CAA записей (для Let's Encrypt):"
CAA_RECORDS=$(dig +short $DOMAIN CAA 2>/dev/null || echo "")
if [ -z "$CAA_RECORDS" ]; then
    echo "   ✓ CAA записи не найдены (это нормально)"
else
    echo "   CAA записи: $CAA_RECORDS"
fi

echo ""
echo "4. Проверка с разных DNS серверов:"
echo "   Google DNS (8.8.8.8):"
GOOGLE_IP=$(dig @8.8.8.8 +short $DOMAIN A 2>/dev/null || echo "")
if [ -n "$GOOGLE_IP" ]; then
    echo "   ✓ $GOOGLE_IP"
    if [ "$GOOGLE_IP" = "$SERVER_IP" ]; then
        echo "   ✓ IP совпадает"
    else
        echo "   ⚠ IP не совпадает"
    fi
else
    echo "   ❌ Не найдено"
fi

echo ""
echo "   Cloudflare DNS (1.1.1.1):"
CF_IP=$(dig @1.1.1.1 +short $DOMAIN A 2>/dev/null || echo "")
if [ -n "$CF_IP" ]; then
    echo "   ✓ $CF_IP"
    if [ "$CF_IP" = "$SERVER_IP" ]; then
        echo "   ✓ IP совпадает"
    else
        echo "   ⚠ IP не совпадает"
    fi
else
    echo "   ❌ Не найдено"
fi

echo ""
echo "📋 Рекомендации:"
if [ "$A_RECORD" != "$SERVER_IP" ]; then
    echo "   1. Обновите IP в DuckDNS на $SERVER_IP"
    echo "   2. Подождите 5-10 минут для распространения DNS"
    echo "   3. Запустите этот скрипт снова для проверки"
else
    echo "   ✓ DNS настроен правильно"
    echo "   Если Let's Encrypt все еще не работает, попробуйте:"
    echo "   - Подождать еще несколько минут"
    echo "   - Использовать DNS challenge: sudo ./setup-https-dns.sh"
fi

