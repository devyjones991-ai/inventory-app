#!/bin/bash
# Скрипт для проверки конфигурации локального Supabase

echo "=== Проверка конфигурации локального Supabase ==="
echo ""

cd ~/inventory-app

# 1. Проверка Supabase
echo "1. Проверка Supabase:"
if supabase status 2>/dev/null | grep -q "API URL"; then
    API_URL=$(supabase status 2>/dev/null | grep "API URL" | awk '{print $3}')
    ANON_KEY=$(supabase status 2>/dev/null | grep "anon key" | awk '{print $3}')
    echo "   ✓ Supabase запущен"
    echo "   API URL: $API_URL"
    echo "   Anon Key: ${ANON_KEY:0:30}..."
else
    echo "   ✗ Supabase не запущен!"
    echo "   Запустите: supabase start"
    exit 1
fi

echo ""

# 2. Проверка env.js
echo "2. Проверка env.js:"
if [ -f "public/env.js" ]; then
    echo "   ✓ Файл public/env.js существует"
    if grep -q "multiminder.duckdns.org" public/env.js; then
        echo "   ✓ Используется локальный домен через nginx"
        if grep -q "$ANON_KEY" public/env.js; then
            echo "   ✓ Anon key совпадает с Supabase"
        else
            echo "   ⚠ Anon key не совпадает! Нужно обновить env.js"
        fi
    else
        echo "   ⚠ env.js не использует локальный домен!"
        echo "   Запустите: ./fix-env-js.sh"
    fi
else
    echo "   ✗ Файл public/env.js не найден!"
    echo "   Запустите: ./fix-env-js.sh"
fi

echo ""

# 3. Проверка Docker контейнера
echo "3. Проверка Docker контейнера:"
if docker ps --format "{{.Names}}" | grep -q "inventory-app-frontend"; then
    echo "   ✓ Контейнер запущен"
    
    # Проверка env.js в контейнере
    CONTAINER_ENV=$(docker exec inventory-app-frontend cat /usr/share/nginx/html/env.js 2>/dev/null)
    if echo "$CONTAINER_ENV" | grep -q "multiminder.duckdns.org"; then
        echo "   ✓ env.js в контейнере использует локальный домен"
    else
        echo "   ⚠ env.js в контейнере не использует локальный домен!"
        echo "   Нужно пересобрать образ: docker compose -f docker-compose.prod.yml build --no-cache app"
    fi
else
    echo "   ⚠ Контейнер не запущен"
fi

echo ""

# 4. Проверка nginx
echo "4. Проверка nginx:"
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "   ✓ Nginx запущен"
    
    # Проверка проксирования Supabase
    if [ -f "/etc/nginx/sites-available/multiminder.duckdns.org" ]; then
        if grep -q "proxy_pass http://127.0.0.1:54321" /etc/nginx/sites-available/multiminder.duckdns.org; then
            echo "   ✓ Nginx настроен для проксирования Supabase"
        else
            echo "   ⚠ Nginx не настроен для проксирования Supabase!"
        fi
    fi
else
    echo "   ⚠ Nginx не запущен"
fi

echo ""

# 5. Тест подключения
echo "5. Тест подключения:"
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54321/rest/v1/ | grep -q "200\|401\|404"; then
    echo "   ✓ Supabase API доступен локально"
else
    echo "   ✗ Supabase API недоступен локально!"
fi

if curl -s -o /dev/null -w "%{http_code}" http://multiminder.duckdns.org/auth/v1/health 2>/dev/null | grep -q "200\|401\|404"; then
    echo "   ✓ Supabase API доступен через nginx proxy"
else
    echo "   ⚠ Supabase API недоступен через nginx proxy"
    echo "   Проверьте конфигурацию nginx"
fi

echo ""
echo "=== Проверка завершена ==="
echo ""
echo "Если есть проблемы:"
echo "  1. Запустите: ./fix-env-js.sh"
echo "  2. Пересоберите Docker: docker compose -f docker-compose.prod.yml build --no-cache app"
echo "  3. Перезапустите: docker compose -f docker-compose.prod.yml up -d app"

