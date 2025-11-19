#!/bin/bash
# Скрипт для пересборки Docker контейнера с последними изменениями

echo "=== Пересборка Docker контейнера ==="

cd ~/inventory-app

# 1. Обновить код
echo "1. Обновление кода из репозитория..."
git pull origin main

# 2. Убедиться, что env.js правильный
echo ""
echo "2. Проверка env.js..."
if ! grep -q "multiminder.duckdns.org" public/env.js 2>/dev/null; then
    echo "   Обновление env.js..."
    ./fix-env-js.sh
fi

# 3. Пересобрать Docker образ без кэша
echo ""
echo "3. Пересборка Docker образа (без кэша)..."
docker compose -f docker-compose.prod.yml build --no-cache app

# 4. Перезапустить контейнер
echo ""
echo "4. Перезапуск контейнера..."
docker compose -f docker-compose.prod.yml up -d app

# 5. Проверка статуса
echo ""
echo "5. Проверка статуса..."
sleep 5
docker ps --filter "name=inventory-app-frontend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Пересборка завершена!"
echo "   Подождите 10-15 секунд и обновите страницу в браузере (Ctrl+F5)"

