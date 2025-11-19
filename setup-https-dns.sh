#!/bin/bash
# Скрипт для настройки HTTPS через DNS challenge (для DuckDNS)

set -e

echo "🔒 Настройка HTTPS через DNS challenge для multiminder.duckdns.org"
echo ""

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Этот скрипт должен быть запущен с правами root (sudo)"
    exit 1
fi

DOMAIN="multiminder.duckdns.org"
SERVER_IP="89.207.218.148"

# 1. Диагностика DNS
echo "1. Диагностика DNS..."
echo "   Проверка DNS записей для $DOMAIN:"
echo ""

# Проверка A записи
echo "   A запись:"
A_RECORD=$(dig +short $DOMAIN A)
if [ -z "$A_RECORD" ]; then
    echo "   ❌ A запись не найдена!"
    echo "   Убедитесь, что домен настроен в DuckDNS"
else
    echo "   ✓ A запись: $A_RECORD"
    if [ "$A_RECORD" != "$SERVER_IP" ]; then
        echo "   ⚠ A запись ($A_RECORD) не совпадает с IP сервера ($SERVER_IP)"
        echo "   Обновите запись в DuckDNS: https://www.duckdns.org"
    else
        echo "   ✓ A запись совпадает с IP сервера"
    fi
fi

echo ""
echo "   Проверка доступности домена:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "   ✓ Домен доступен (HTTP $HTTP_CODE)"
else
    echo "   ⚠ Домен недоступен (HTTP $HTTP_CODE)"
    echo "   Проверьте, что Nginx работает и порт 80 открыт"
fi

echo ""
read -p "Продолжить настройку HTTPS? (y/n): " continue_ssl
if [ "$continue_ssl" != "y" ] && [ "$continue_ssl" != "Y" ]; then
    echo "Настройка отменена"
    exit 0
fi

# 2. Установка certbot
echo ""
echo "2. Проверка certbot..."
if ! command -v certbot &> /dev/null; then
    echo "   Установка certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
else
    echo "   ✓ certbot уже установлен"
fi

# 3. Попытка получить сертификат через HTTP challenge
echo ""
echo "3. Попытка получить сертификат через HTTP challenge..."
echo "   (Если это не сработает, будет использован DNS challenge)"

# Запрашиваем email
read -p "   Введите ваш email для уведомлений Let's Encrypt: " EMAIL

# Пробуем HTTP challenge
if certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect 2>&1 | tee /tmp/certbot-output.log; then
    echo "   ✓ Сертификат успешно получен через HTTP challenge!"
    CERT_METHOD="http"
else
    echo "   ⚠ HTTP challenge не сработал, используем DNS challenge"
    CERT_METHOD="dns"
fi

# 4. Если HTTP не сработал, используем DNS challenge
if [ "$CERT_METHOD" = "dns" ]; then
    echo ""
    echo "4. Получение сертификата через DNS challenge..."
    echo ""
    echo "   Для DNS challenge нужно добавить TXT запись в DNS."
    echo "   Certbot попросит вас добавить TXT запись вручную."
    echo ""
    read -p "   Нажмите Enter, когда будете готовы..."
    
    # Используем manual DNS challenge
    certbot certonly --manual --preferred-challenges dns -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" || {
        echo ""
        echo "   ❌ Не удалось получить сертификат через DNS challenge"
        echo ""
        echo "   Альтернативный вариант:"
        echo "   1. Обновите DNS запись в DuckDNS"
        echo "   2. Подождите распространения DNS (5-10 минут)"
        echo "   3. Запустите снова: sudo ./setup-https-dns.sh"
        exit 1
    }
fi

# 5. Настройка Nginx для HTTPS
echo ""
echo "5. Настройка Nginx для HTTPS..."

NGINX_CONFIG="/etc/nginx/sites-available/inventory-app"

# Создаем полную конфигурацию с HTTPS
cat > "$NGINX_CONFIG" << 'NGINX_EOF'
# HTTP server - редирект на HTTPS
server {
    listen 80;
    server_name multiminder.duckdns.org;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name multiminder.duckdns.org;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/multiminder.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/multiminder.duckdns.org/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
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
NGINX_EOF

# Включаем конфигурацию
ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/inventory-app

# Проверяем конфигурацию
if nginx -t; then
    systemctl reload nginx
    echo "   ✓ Nginx перезагружен с HTTPS конфигурацией"
else
    echo "   ❌ Ошибка в конфигурации Nginx!"
    exit 1
fi

# 6. Настройка автоматического обновления
echo ""
echo "6. Настройка автоматического обновления сертификата..."
if ! grep -q "certbot renew" /etc/crontab; then
    echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'" >> /etc/crontab
    echo "   ✓ Автоматическое обновление настроено"
else
    echo "   ✓ Автоматическое обновление уже настроено"
fi

# 7. Обновление конфигурации приложения
echo ""
echo "7. Обновление конфигурации приложения..."

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
echo "   2. Пересоберите Docker контейнер: cd ~/inventory-app && ./rebuild-docker.sh"
echo "   3. Убедитесь, что все работает корректно"

