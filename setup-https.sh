#!/bin/bash
# Скрипт для настройки HTTPS с Let's Encrypt для multiminder.duckdns.org

set -e

echo "🔒 Настройка HTTPS для multiminder.duckdns.org"
echo ""

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Этот скрипт должен быть запущен с правами root (sudo)"
    exit 1
fi

DOMAIN="multiminder.duckdns.org"
NGINX_CONFIG="/etc/nginx/sites-available/inventory-app"
NGINX_CONFIG_ENABLED="/etc/nginx/sites-enabled/inventory-app"

# 1. Установка certbot
echo "1. Проверка и установка certbot..."
if ! command -v certbot &> /dev/null; then
    echo "   Установка certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
else
    echo "   ✓ certbot уже установлен"
fi

# 2. Проверка, что nginx установлен
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx не установлен!"
    exit 1
fi

# 3. Проверка, что домен указывает на сервер
echo ""
echo "2. Проверка DNS..."
echo "   Убедитесь, что домен $DOMAIN указывает на IP этого сервера"
echo "   Нажмите Enter для продолжения или Ctrl+C для отмены..."
read

# 4. Проверка конфигурации nginx
echo ""
echo "3. Проверка конфигурации Nginx..."

# Создаем временную конфигурацию для certbot (если её нет)
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "   Создание конфигурации Nginx..."
    mkdir -p /etc/nginx/sites-available
    mkdir -p /etc/nginx/sites-enabled
    
    cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    server_name multiminder.duckdns.org;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Proxy to Supabase API (локальный Supabase)
    location /rest/v1/ {
        proxy_pass http://127.0.0.1:54321/rest/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
    }
    
    # Proxy to Supabase Auth
    location /auth/v1/ {
        proxy_pass http://127.0.0.1:54321/auth/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
    }
    
    # Proxy to Supabase Realtime
    location /realtime/v1/ {
        proxy_pass http://127.0.0.1:54321/realtime/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Proxy to Supabase Storage
    location /storage/v1/ {
        proxy_pass http://127.0.0.1:54321/storage/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy to application (Docker container on port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Security headers for HTML
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header Referrer-Policy "strict-origin-when-cross-origin";
    }
    
    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF
fi

# Включаем конфигурацию
if [ ! -L "$NGINX_CONFIG_ENABLED" ]; then
    ln -sf "$NGINX_CONFIG" "$NGINX_CONFIG_ENABLED"
fi

# Проверяем конфигурацию
if nginx -t; then
    echo "   ✓ Конфигурация Nginx валидна"
    systemctl reload nginx
else
    echo "   ❌ Ошибка в конфигурации Nginx!"
    exit 1
fi

# 5. Получение SSL сертификата
echo ""
echo "4. Получение SSL сертификата от Let's Encrypt..."
echo "   Это может занять несколько минут..."

# Запрашиваем email для уведомлений
read -p "   Введите ваш email для уведомлений Let's Encrypt: " EMAIL

if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect; then
    echo "   ✓ SSL сертификат успешно получен и настроен!"
else
    echo "   ❌ Ошибка при получении SSL сертификата"
    echo "   Проверьте:"
    echo "   1. Домен $DOMAIN указывает на IP этого сервера"
    echo "   2. Порт 80 открыт в firewall"
    echo "   3. Nginx работает и доступен извне"
    exit 1
fi

# 6. Настройка автоматического обновления сертификата
echo ""
echo "5. Настройка автоматического обновления сертификата..."
if ! grep -q "certbot renew" /etc/crontab; then
    echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'" >> /etc/crontab
    echo "   ✓ Автоматическое обновление настроено"
else
    echo "   ✓ Автоматическое обновление уже настроено"
fi

# 7. Проверка конфигурации после certbot
echo ""
echo "6. Проверка финальной конфигурации..."
if nginx -t; then
    systemctl reload nginx
    echo "   ✓ Nginx перезагружен с HTTPS конфигурацией"
else
    echo "   ⚠ Ошибка в конфигурации после certbot, проверьте вручную"
fi

# 8. Обновление конфигурации приложения для HTTPS
echo ""
echo "7. Обновление конфигурации приложения..."

# Обновляем env.js для использования HTTPS
if [ -f "/home/bag/inventory-app/public/env.js" ]; then
    sed -i 's|http://multiminder.duckdns.org|https://multiminder.duckdns.org|g' /home/bag/inventory-app/public/env.js
    echo "   ✓ env.js обновлен для HTTPS"
fi

echo ""
echo "✅ HTTPS успешно настроен!"
echo ""
echo "🌐 Ваш сайт теперь доступен по адресу: https://$DOMAIN"
echo "   HTTP запросы автоматически перенаправляются на HTTPS"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Проверьте работу сайта: https://$DOMAIN"
echo "   2. Убедитесь, что все работает корректно"
echo "   3. Сертификат будет автоматически обновляться каждую ночь"
echo ""
echo "🔍 Проверить статус сертификата: certbot certificates"
echo "🔄 Обновить сертификат вручную: certbot renew"

