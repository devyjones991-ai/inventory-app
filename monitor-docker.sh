#!/bin/bash
# Скрипт мониторинга Docker контейнера с автовосстановлением

CONTAINER_NAME="inventory-app-frontend"
MAX_RESTARTS=5
RESTART_COUNT_FILE="/tmp/inventory-app-restart-count"
LOG_FILE="/var/log/inventory-app-monitor.log"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | sudo tee -a "$LOG_FILE"
}

# Проверка статуса контейнера
check_container() {
    if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        log "WARNING: Контейнер $CONTAINER_NAME не запущен!"
        return 1
    fi
    
    # Проверка health check
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "none")
    if [ "$HEALTH" = "unhealthy" ]; then
        log "WARNING: Контейнер $CONTAINER_NAME unhealthy!"
        return 1
    fi
    
    # Проверка доступности приложения
    if ! curl -f -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
        log "WARNING: Приложение не отвечает на порту 3000!"
        return 1
    fi
    
    return 0
}

# Перезапуск контейнера
restart_container() {
    local restart_count=$(cat "$RESTART_COUNT_FILE" 2>/dev/null || echo "0")
    restart_count=$((restart_count + 1))
    
    if [ $restart_count -gt $MAX_RESTARTS ]; then
        log "ERROR: Превышен лимит перезапусков ($MAX_RESTARTS). Требуется ручное вмешательство!"
        echo "0" > "$RESTART_COUNT_FILE"
        return 1
    fi
    
    log "Перезапуск контейнера (попытка $restart_count/$MAX_RESTARTS)..."
    echo "$restart_count" > "$RESTART_COUNT_FILE"
    
    cd /home/bag/inventory-app
    docker compose -f docker-compose.prod.yml restart app || \
    docker compose -f docker-compose.prod.yml up -d app
    
    sleep 10
    
    # Проверка после перезапуска
    if check_container; then
        log "SUCCESS: Контейнер успешно перезапущен и работает"
        echo "0" > "$RESTART_COUNT_FILE"
        return 0
    else
        log "ERROR: Контейнер не запустился после перезапуска"
        return 1
    fi
}

# Основная логика
main() {
    if check_container; then
        log "OK: Контейнер работает нормально"
        echo "0" > "$RESTART_COUNT_FILE"
    else
        log "Проблема обнаружена, запуск восстановления..."
        restart_container
    fi
}

main

