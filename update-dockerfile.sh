#!/bin/bash
# Скрипт для принудительного обновления Dockerfile.prod

echo "=== Принудительное обновление Dockerfile.prod ==="

cd ~/inventory-app

# Принудительно получить последнюю версию
git fetch origin
git checkout origin/main -- Dockerfile.prod

echo "✓ Dockerfile.prod обновлен"

# Показать ключевые строки
echo ""
echo "Проверка обновленного Dockerfile (строки 64-77):"
sed -n '64,77p' Dockerfile.prod

echo ""
echo "Теперь пересоберите образ:"
echo "  docker compose -f docker-compose.prod.yml build --no-cache app"
echo "  docker compose -f docker-compose.prod.yml up -d app"

