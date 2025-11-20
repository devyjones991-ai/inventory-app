#!/bin/bash
# Скрипт для обновления env.js для работы с HTTPS

set -e

ENV_JS_PATH="/home/bag/inventory-app/public/env.js"
DOMAIN="multiminder.duckdns.org"

echo "🔧 Обновление env.js для HTTPS..."
echo ""

# Проверка существования файла
if [ ! -f "$ENV_JS_PATH" ]; then
    echo "❌ Файл $ENV_JS_PATH не найден!"
    exit 1
fi

# Создаем резервную копию
cp "$ENV_JS_PATH" "${ENV_JS_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✓ Создана резервная копия"

# Обновляем URL на HTTPS
sed -i "s|http://${DOMAIN}|https://${DOMAIN}|g" "$ENV_JS_PATH"
echo "✓ URL обновлены на HTTPS"

# Проверяем результат
echo ""
echo "📋 Текущая конфигурация:"
cat "$ENV_JS_PATH"

echo ""
echo "✅ env.js обновлен для HTTPS"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Пересоберите Docker контейнер: cd ~/inventory-app && ./rebuild-docker.sh"
echo "   2. Проверьте работу сайта: https://${DOMAIN}"

