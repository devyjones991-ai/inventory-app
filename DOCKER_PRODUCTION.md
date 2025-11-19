# 🐳 Docker Production Setup с автовосстановлением

## Быстрый старт

### 1. На сервере выполните:

```bash
cd ~/inventory-app
git pull origin main
chmod +x setup-docker-production.sh monitor-docker.sh
./setup-docker-production.sh
```

Скрипт автоматически:
- ✅ Соберет Docker образ
- ✅ Настроит systemd сервисы
- ✅ Включит автозапуск
- ✅ Запустит приложение и мониторинг

## Что включено

### Автовосстановление
- **Docker restart policy**: `always` - контейнер перезапускается при любом падении
- **Health checks**: каждые 30 секунд проверка доступности приложения
- **Systemd restart**: перезапуск сервиса при сбое
- **Мониторинг**: скрипт проверяет контейнер каждую минуту и перезапускает при проблемах

### Мониторинг
- Скрипт `monitor-docker.sh` проверяет:
  - Запущен ли контейнер
  - Health check статус
  - Доступность приложения на порту 3000
- Логи в `/var/log/inventory-app-monitor.log`
- Автоматический перезапуск при обнаружении проблем

### Ограничения ресурсов
- CPU: 0.5-1.0 ядро
- Память: 256-512 MB
- Логи: максимум 3 файла по 10MB

## Управление

### Полезные команды

```bash
# Статус сервисов
sudo systemctl status inventory-app-production.service
sudo systemctl status inventory-app-monitor.service

# Перезапуск
sudo systemctl restart inventory-app-production.service
sudo systemctl restart inventory-app-monitor.service

# Логи
sudo journalctl -u inventory-app-production.service -f
sudo journalctl -u inventory-app-monitor.service -f
sudo tail -f /var/log/inventory-app-monitor.log

# Docker команды
docker ps -a
docker logs inventory-app-frontend
docker stats inventory-app-frontend
docker compose -f docker-compose.prod.yml ps
```

### Обновление приложения

```bash
cd ~/inventory-app
git pull origin main
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app
```

## Структура файлов

- `docker-compose.prod.yml` - Production конфигурация Docker Compose
- `Dockerfile.prod` - Docker образ приложения
- `inventory-app-production.service` - Systemd сервис для приложения
- `inventory-app-monitor.service` - Systemd сервис для мониторинга
- `monitor-docker.sh` - Скрипт мониторинга и автовосстановления
- `setup-docker-production.sh` - Скрипт автоматической настройки

## Проверка работы

### 1. Проверка контейнера
```bash
docker ps --filter "name=inventory-app-frontend"
```

### 2. Проверка health check
```bash
docker inspect --format='{{.State.Health.Status}}' inventory-app-frontend
```

### 3. Проверка доступности
```bash
curl http://127.0.0.1:3000
```

### 4. Проверка логов мониторинга
```bash
sudo tail -20 /var/log/inventory-app-monitor.log
```

## Решение проблем

### Контейнер не запускается
```bash
# Проверить логи
docker logs inventory-app-frontend

# Пересобрать образ
docker compose -f docker-compose.prod.yml build app

# Перезапустить
sudo systemctl restart inventory-app-production.service
```

### Health check failed
```bash
# Проверить доступность
curl http://127.0.0.1:3000

# Проверить порты
sudo netstat -tlnp | grep 3000

# Перезапустить контейнер
docker compose -f docker-compose.prod.yml restart app
```

### Мониторинг не работает
```bash
# Проверить статус
sudo systemctl status inventory-app-monitor.service

# Проверить права на скрипт
ls -la monitor-docker.sh
chmod +x monitor-docker.sh

# Перезапустить
sudo systemctl restart inventory-app-monitor.service
```

## Интеграция с Supabase

Приложение использует локальный Supabase. Убедитесь, что:

1. Supabase запущен: `supabase status`
2. Переменные окружения настроены в `.env.local`:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-key-here
VITE_API_BASE_URL=http://127.0.0.1:54321
```

3. При сборке Docker образа переменные передаются через `docker-compose.prod.yml`

## Автозапуск при перезагрузке

Все сервисы настроены на автозапуск:
- `inventory-app-production.service` - запускает Docker контейнер
- `inventory-app-monitor.service` - запускает мониторинг
- `supabase.service` - запускает локальный Supabase

После перезагрузки сервера все сервисы запустятся автоматически.

