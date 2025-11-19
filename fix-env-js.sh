#!/bin/bash
# Скрипт для быстрого исправления env.js на сервере

echo "=== Исправление env.js для локального Supabase ==="

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
cat > public/env.js << EOF
// Runtime environment overrides for static hosting
// Локальный Supabase через nginx proxy
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: "http://multiminder.duckdns.org",
  VITE_SUPABASE_ANON_KEY: "$ANON_KEY",
  VITE_API_BASE_URL: "http://multiminder.duckdns.org",
};
EOF

# Убеждаемся, что файл создан правильно
if [ ! -f "public/env.js" ]; then
    echo "✗ Ошибка: не удалось создать public/env.js"
    exit 1
fi

# Проверяем содержимое
if ! grep -q "multiminder.duckdns.org" public/env.js; then
    echo "✗ Ошибка: env.js не содержит локальный домен!"
    exit 1
fi

echo "✓ env.js обновлен"
echo "  URL: http://multiminder.duckdns.org"
echo "  Anon key: ${ANON_KEY:0:20}..."

# Если используется Docker, пересобрать образ
if docker ps --format "{{.Names}}" | grep -q "inventory-app-frontend"; then
    echo ""
    echo "Пересборка Docker образа (без кэша)..."
    docker compose -f docker-compose.prod.yml build --no-cache app
    docker compose -f docker-compose.prod.yml up -d app
    echo "✓ Docker контейнер перезапущен"
fi

echo ""
echo "✅ Готово! Обновите страницу в браузере (Ctrl+F5)"

