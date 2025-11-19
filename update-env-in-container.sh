#!/bin/bash
# Скрипт для обновления env.js в работающем Docker контейнере

echo "=== Обновление env.js в Docker контейнере ==="

cd ~/inventory-app

# Проверка Supabase
if ! supabase status 2>/dev/null | grep -q "API URL"; then
    echo "⚠ Supabase не запущен!"
    echo "  Запустите: supabase start"
    exit 1
fi

# Получаем значения
ANON_KEY=$(supabase status 2>/dev/null | grep "anon key" | awk '{print $3}')

# Создаем env.js
ENV_JS_CONTENT="// Runtime environment overrides for static hosting
// Локальный Supabase через nginx proxy
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: \"http://multiminder.duckdns.org\",
  VITE_SUPABASE_ANON_KEY: \"$ANON_KEY\",
  VITE_API_BASE_URL: \"http://multiminder.duckdns.org\",
};"

# Проверяем, запущен ли контейнер
if docker ps --format "{{.Names}}" | grep -q "inventory-app-frontend"; then
    echo "Обновление env.js в контейнере..."
    
    # Обновляем env.js в контейнере
    echo "$ENV_JS_CONTENT" | docker exec -i inventory-app-frontend sh -c 'cat > /usr/share/nginx/html/env.js'
    
    # Проверяем, что файл обновлен
    if docker exec inventory-app-frontend grep -q "multiminder.duckdns.org" /usr/share/nginx/html/env.js; then
        echo "✓ env.js обновлен в контейнере"
        echo "  URL: http://multiminder.duckdns.org"
        echo "  Anon key: ${ANON_KEY:0:20}..."
        
        # Перезапускаем nginx в контейнере для применения изменений
        docker exec inventory-app-frontend nginx -s reload 2>/dev/null || true
        echo "✓ Nginx перезагружен"
    else
        echo "✗ Ошибка: env.js не обновлен в контейнере"
        exit 1
    fi
else
    echo "⚠ Контейнер не запущен"
    echo "  Создайте env.js локально: ./fix-env-js.sh"
    exit 1
fi

echo ""
echo "✅ Готово! Обновите страницу в браузере (Ctrl+F5)"

