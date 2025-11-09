#!/bin/bash
# Скрипт для настройки автозапуска приложения и Supabase на сервере

set -e

echo "=== Настройка автозапуска для production ==="

# Переменные
PROJECT_DIR="/home/bag/inventory-app"
USER="bag"

# Проверка прав
if [ "$EUID" -eq 0 ]; then 
   echo "⚠ Не запускайте скрипт с sudo. Он сам использует sudo где нужно."
   exit 1
fi

cd "$PROJECT_DIR"

# 1. Настройка автозапуска Docker
echo -e "\n[1/6] Настройка автозапуска Docker..."
if ! systemctl is-enabled docker > /dev/null 2>&1; then
    echo "Включение автозапуска Docker..."
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "✓ Docker настроен на автозапуск"
else
    echo "✓ Docker уже настроен на автозапуск"
fi

# 2. Настройка автозапуска Supabase
echo -e "\n[2/6] Настройка автозапуска Supabase..."
if [ ! -f "/usr/local/bin/supabase" ]; then
    echo "⚠ Supabase CLI не найден в /usr/local/bin/supabase"
    echo "Установите его: bash setup-supabase-local.sh"
    exit 1
fi

# Копируем systemd service для Supabase
sudo cp "$PROJECT_DIR/supabase.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable supabase.service
echo "✓ Supabase service настроен"

# 3. Настройка автозапуска приложения (Docker Compose)
echo -e "\n[3/6] Настройка автозапуска приложения..."
# Копируем systemd service для приложения
sudo cp "$PROJECT_DIR/inventory-app-production.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable inventory-app-production.service
echo "✓ Приложение service настроен"

# 4. Настройка nginx
echo -e "\n[4/6] Настройка nginx..."
# Проверяем, установлен ли nginx
if ! command -v nginx &> /dev/null; then
    echo "Установка nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Копируем конфигурацию nginx
NGINX_CONF="/etc/nginx/sites-available/multiminder.duckdns.org"
sudo cp "$PROJECT_DIR/nginx.conf" "$NGINX_CONF"

# Создаем симлинк, если его нет
if [ ! -L "/etc/nginx/sites-enabled/multiminder.duckdns.org" ]; then
    sudo ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/
fi

# Удаляем default конфигурацию, если она активна
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Проверяем конфигурацию nginx
if sudo nginx -t; then
    echo "✓ Конфигурация nginx валидна"
    sudo systemctl enable nginx
    sudo systemctl restart nginx
    echo "✓ Nginx перезапущен"
else
    echo "✗ Ошибка в конфигурации nginx!"
    exit 1
fi

# 5. Запуск сервисов
echo -e "\n[5/6] Запуск сервисов..."
echo "Запуск Supabase..."
sudo systemctl start supabase.service
sleep 5

echo "Запуск приложения..."
# Сначала собираем образ, если нужно
cd "$PROJECT_DIR"
docker compose -f docker-compose.yml build app || echo "⚠ Ошибка сборки, продолжаем..."
sudo systemctl start inventory-app-production.service

# 6. Проверка статуса
echo -e "\n[6/6] Проверка статуса сервисов..."
echo ""
echo "=== Статус сервисов ==="
echo ""
echo "Docker:"
sudo systemctl status docker --no-pager -l | head -3
echo ""
echo "Supabase:"
sudo systemctl status supabase.service --no-pager -l | head -5
echo ""
echo "Приложение:"
sudo systemctl status inventory-app-production.service --no-pager -l | head -5
echo ""
echo "Nginx:"
sudo systemctl status nginx --no-pager -l | head -3

# Проверка доступности
echo ""
echo "=== Проверка доступности ==="
sleep 3

if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 | grep -q "200\|301\|302"; then
    echo "✓ Приложение доступно на localhost:3000"
else
    echo "⚠ Приложение не отвечает на localhost:3000"
fi

if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54321 | grep -q "200\|401"; then
    echo "✓ Supabase API доступен на localhost:54321"
else
    echo "⚠ Supabase API не отвечает на localhost:54321"
fi

if curl -s -o /dev/null -w "%{http_code}" https://multiminder.duckdns.org | grep -q "200\|301\|302"; then
    echo "✓ Сайт доступен по https://multiminder.duckdns.org"
else
    echo "⚠ Сайт не отвечает по https://multiminder.duckdns.org"
fi

echo ""
echo "=== Настройка завершена! ==="
echo ""
echo "Полезные команды:"
echo "  sudo systemctl status supabase.service          - Статус Supabase"
echo "  sudo systemctl status inventory-app-production.service - Статус приложения"
echo "  sudo systemctl status nginx                       - Статус nginx"
echo ""
echo "  sudo systemctl restart supabase.service           - Перезапуск Supabase"
echo "  sudo systemctl restart inventory-app-production.service - Перезапуск приложения"
echo "  sudo systemctl restart nginx                      - Перезапуск nginx"
echo ""
echo "  sudo journalctl -u supabase.service -f           - Логи Supabase"
echo "  sudo journalctl -u inventory-app-production.service -f - Логи приложения"
echo ""
echo "🌐 Сайт: https://multiminder.duckdns.org"
echo "📊 Supabase Studio: http://YOUR_SERVER_IP:54323"

