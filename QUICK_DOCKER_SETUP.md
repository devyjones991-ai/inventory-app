# 🚀 Быстрый запуск Docker на сервере

## Шаги для запуска

### 1. На сервере обновите репозиторий:

```bash
cd ~/inventory-app
git pull origin main
```

### 2. Убедитесь, что Supabase запущен:

```bash
supabase status
```

Если не запущен:
```bash
supabase start
```

### 3. Проверьте/создайте .env.local:

```bash
cat .env.local
```

Если файла нет, создайте его:
```bash
# Получите значения из supabase status
supabase status | grep -E "API URL|anon key"

# Создайте .env.local
cat > .env.local << EOF
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=ваш_anon_key_из_supabase_status
VITE_API_BASE_URL=http://127.0.0.1:54321
EOF
```

### 4. Запустите автоматическую настройку:

```bash
chmod +x setup-docker-production.sh monitor-docker.sh
./setup-docker-production.sh
```

### 5. Проверьте статус:

```bash
# Проверка контейнера
docker ps --filter "name=inventory-app-frontend"

# Проверка сервисов
sudo systemctl status inventory-app-production.service
sudo systemctl status inventory-app-monitor.service

# Проверка доступности
curl http://127.0.0.1:3000
```

## Готово! 🎉

Приложение запущено в Docker с:
- ✅ Автовосстановлением при падении
- ✅ Health checks каждые 30 секунд
- ✅ Мониторингом каждую минуту
- ✅ Автозапуском при перезагрузке сервера

## Полезные команды

```bash
# Логи контейнера
docker logs inventory-app-frontend

# Логи мониторинга
sudo tail -f /var/log/inventory-app-monitor.log

# Перезапуск
sudo systemctl restart inventory-app-production.service

# Статистика ресурсов
docker stats inventory-app-frontend
```

Подробная документация: [DOCKER_PRODUCTION.md](./DOCKER_PRODUCTION.md)

