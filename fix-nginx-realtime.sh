#!/bin/bash
# Скрипт для исправления конфигурации Nginx для Realtime

set -e

NGINX_CONFIG="/etc/nginx/sites-available/inventory-app"

echo "🔧 Проверка и исправление конфигурации Nginx..."
echo ""

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Файл конфигурации не найден: $NGINX_CONFIG"
    echo "   Проверьте, что Nginx настроен правильно"
    exit 1
fi

# Проверяем, есть ли proxy_pass для Realtime
if ! grep -q "proxy_pass.*realtime" "$NGINX_CONFIG"; then
    echo "⚠ В конфигурации отсутствует proxy_pass для Realtime"
    echo "   Это может вызывать проблемы с WebSocket соединениями"
    
    # Создаем резервную копию
    cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Исправляем Realtime location (добавляем proxy_pass если его нет)
    sed -i '/location \/realtime\/v1\/ {/,/proxy_read_timeout 86400;/ {
        /proxy_pass/! {
            /location \/realtime\/v1\/ {/a\
        proxy_pass http://127.0.0.1:54321/realtime/v1/;
        }
    }' "$NGINX_CONFIG"
    
    echo "✓ Конфигурация Realtime исправлена"
else
    echo "✓ Realtime конфигурация в порядке"
fi

# Проверяем X-Forwarded-Proto для HTTPS
if grep -q "listen 443" "$NGINX_CONFIG"; then
    echo "✓ HTTPS конфигурация найдена"
    
    # Убеждаемся, что X-Forwarded-Proto установлен правильно
    if ! grep -q "X-Forwarded-Proto \$scheme" "$NGINX_CONFIG"; then
        echo "⚠ Добавляем X-Forwarded-Proto заголовки..."
        # Это сложнее сделать через sed, лучше проверить вручную
        echo "   Проверьте, что все location блоки имеют:"
        echo "   proxy_set_header X-Forwarded-Proto \$scheme;"
    else
        echo "✓ X-Forwarded-Proto заголовки настроены"
    fi
else
    echo "⚠ HTTPS конфигурация не найдена"
    echo "   Если SSL сертификат настроен, убедитесь, что Nginx использует HTTPS блок"
fi

# Проверяем конфигурацию
echo ""
echo "Проверка синтаксиса Nginx..."
if nginx -t; then
    echo "✓ Конфигурация валидна"
    echo ""
    read -p "Перезагрузить Nginx? (y/n): " reload
    if [ "$reload" = "y" ] || [ "$reload" = "Y" ]; then
        systemctl reload nginx
        echo "✓ Nginx перезагружен"
    fi
else
    echo "❌ Ошибка в конфигурации Nginx!"
    exit 1
fi

echo ""
echo "✅ Проверка завершена"

