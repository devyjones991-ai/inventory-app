#!/bin/bash
# Скрипт для установки SSL сертификата через Let's Encrypt

set -e

DOMAIN="multiminder.duckdns.org"
EMAIL="${1:-}"  # Email можно передать как первый аргумент

echo "=== Установка SSL сертификата для $DOMAIN ==="

# Проверка прав
if [ "$EUID" -eq 0 ]; then 
   echo "⚠ Не запускайте скрипт с sudo. Он сам использует sudo где нужно."
   exit 1
fi

# Установка certbot, если не установлен
if ! command -v certbot &> /dev/null; then
    echo "Установка certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Проверка, что nginx установлен и работает
if ! command -v nginx &> /dev/null; then
    echo "✗ Nginx не установлен. Установите nginx сначала."
    exit 1
fi

# Проверка, что nginx запущен
if ! sudo systemctl is-active --quiet nginx; then
    echo "Запуск nginx..."
    sudo systemctl start nginx
fi

# Проверка доступности домена
echo "Проверка доступности домена $DOMAIN..."
if ! curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" | grep -q "200\|301\|302"; then
    echo "⚠ Внимание: домен $DOMAIN может быть недоступен"
    echo "  Убедитесь, что:"
    echo "  - DNS запись для $DOMAIN указывает на IP этого сервера"
    echo "  - Порт 80 открыт в firewall"
    echo ""
    read -p "Продолжить установку SSL? (y/n): " continue_ssl
    if [ "$continue_ssl" != "y" ] && [ "$continue_ssl" != "Y" ]; then
        echo "Установка SSL отменена"
        exit 0
    fi
fi

# Получение SSL сертификата
echo ""
echo "Получение SSL сертификата через Let's Encrypt..."

if [ -n "$EMAIL" ]; then
    echo "Использование email: $EMAIL"
    CERTBOT_CMD="sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect"
else
    echo "Использование регистрации без email (не рекомендуется для production)"
    CERTBOT_CMD="sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email --redirect"
fi

if $CERTBOT_CMD; then
    echo ""
    echo "✓ SSL сертификат успешно установлен!"
    echo "✓ Nginx автоматически настроен для HTTPS"
    echo ""
    echo "Проверка конфигурации nginx..."
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✓ Nginx перезагружен с новой конфигурацией"
    fi
    
    echo ""
    echo "=== SSL установлен успешно! ==="
    echo ""
    echo "Проверьте доступность:"
    echo "  https://$DOMAIN"
    echo ""
    echo "Автоматическое обновление сертификата настроено через systemd timer"
    echo "Проверить статус: sudo systemctl status certbot.timer"
else
    echo ""
    echo "✗ Не удалось установить SSL сертификат"
    echo ""
    echo "Возможные причины:"
    echo "  - Домен $DOMAIN не указывает на IP этого сервера"
    echo "  - Порт 80 не доступен извне (проверьте firewall)"
    echo "  - Проблемы с DNS (может потребоваться время для распространения)"
    echo "  - Превышен лимит запросов Let's Encrypt (5 в неделю на домен)"
    echo ""
    echo "Попробуйте позже или проверьте настройки DNS и firewall"
    exit 1
fi

