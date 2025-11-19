#!/bin/bash
# Полная настройка Docker production с мониторингом

set -e

echo "=== Настройка Docker Production с автовосстановлением ==="

cd ~/inventory-app

# 1. Сделать скрипты исполняемыми
chmod +x monitor-docker.sh

# 2. Создать директорию для логов
sudo mkdir -p /var/log
sudo touch /var/log/inventory-app-monitor.log
sudo chown bag:bag /var/log/inventory-app-monitor.log

# 3. Собрать Docker образ
echo "Сборка Docker образа..."
docker compose -f docker-compose.prod.yml build app

# 4. Установить systemd сервисы
echo "Установка systemd сервисов..."
sudo cp inventory-app-production.service /etc/systemd/system/
sudo cp inventory-app-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload

# 5. Включить автозапуск
sudo systemctl enable inventory-app-production.service
sudo systemctl enable inventory-app-monitor.service

# 6. Запустить сервисы
echo "Запуск сервисов..."
sudo systemctl start inventory-app-production.service
sleep 5
sudo systemctl start inventory-app-monitor.service

# 7. Проверка статуса
echo ""
echo "=== Статус сервисов ==="
sudo systemctl status inventory-app-production.service --no-pager -l | head -10
echo ""
sudo systemctl status inventory-app-monitor.service --no-pager -l | head -10
echo ""

# 8. Проверка контейнера
echo "=== Проверка Docker контейнера ==="
docker ps --filter "name=inventory-app-frontend"
echo ""
HEALTH=$(docker inspect --format='{{.State.Health.Status}}' inventory-app-frontend 2>/dev/null || echo "none")
echo "Health check статус: $HEALTH"

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "Полезные команды:"
echo "  docker ps -a                                    - Список контейнеров"
echo "  docker logs inventory-app-frontend              - Логи контейнера"
echo "  docker stats inventory-app-frontend              - Статистика ресурсов"
echo "  sudo systemctl status inventory-app-monitor     - Статус мониторинга"
echo "  sudo tail -f /var/log/inventory-app-monitor.log - Логи мониторинга"

