# Настройка Production окружения

## Автоматический запуск при перезагрузке сервера

### Быстрая настройка

Выполните на сервере:

```bash
cd ~/inventory-app
bash setup-production-autostart.sh
```

Скрипт автоматически:
1. ✅ Настроит автозапуск Docker
2. ✅ Настроит автозапуск Supabase
3. ✅ Настроит автозапуск приложения
4. ✅ Настроит nginx для проксирования
5. ✅ Запустит все сервисы

### Что будет запускаться автоматически:

1. **Docker** - автозапуск при загрузке системы
2. **Supabase** - локальный Supabase (порт 54321)
3. **Приложение** - Docker контейнер с приложением (порт 3000)
4. **Nginx** - проксирование на приложение и Supabase API

### Структура проксирования:

- `https://multiminder.duckdns.org/` → `http://127.0.0.1:3000` (приложение)
- `https://multiminder.duckdns.org/rest/v1/` → `http://127.0.0.1:54321/rest/v1/` (Supabase REST API)
- `https://multiminder.duckdns.org/auth/v1/` → `http://127.0.0.1:54321/auth/v1/` (Supabase Auth)
- `https://multiminder.duckdns.org/realtime/v1/` → `http://127.0.0.1:54321/realtime/v1/` (Supabase Realtime)
- `https://multiminder.duckdns.org/storage/v1/` → `http://127.0.0.1:54321/storage/v1/` (Supabase Storage)

### Systemd сервисы:

- `supabase.service` - управляет локальным Supabase
- `inventory-app-production.service` - управляет Docker контейнером приложения
- `nginx.service` - веб-сервер (уже должен быть настроен)

### Полезные команды:

```bash
# Статус всех сервисов
sudo systemctl status supabase.service
sudo systemctl status inventory-app-production.service
sudo systemctl status nginx

# Перезапуск сервисов
sudo systemctl restart supabase.service
sudo systemctl restart inventory-app-production.service
sudo systemctl restart nginx

# Логи
sudo journalctl -u supabase.service -f
sudo journalctl -u inventory-app-production.service -f
sudo journalctl -u nginx -f

# Остановка сервисов
sudo systemctl stop supabase.service
sudo systemctl stop inventory-app-production.service

# Отключение автозапуска (если нужно)
sudo systemctl disable supabase.service
sudo systemctl disable inventory-app-production.service
```

### Проверка работы:

```bash
# Проверить доступность приложения
curl http://127.0.0.1:3000

# Проверить доступность Supabase
curl http://127.0.0.1:54321/rest/v1/

# Проверить через домен
curl https://multiminder.duckdns.org
```

### Обновление приложения:

```bash
cd ~/inventory-app

# Обновить код
git pull

# Пересобрать и перезапустить
docker compose -f docker-compose.yml build app
docker compose -f docker-compose.yml up -d app

# Или перезапустить через systemd
sudo systemctl restart inventory-app-production.service
```

### Обновление Supabase миграций:

```bash
cd ~/inventory-app

# Применить новые миграции
supabase db push

# Или сбросить и применить все заново
supabase db reset
```

### Настройка переменных окружения:

Создайте `.env.local` в корне проекта:

```bash
# Получите значения из Supabase
supabase status

# Создайте .env.local
cat > .env.local << EOF
VITE_SUPABASE_URL=http://YOUR_SERVER_IP:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://YOUR_SERVER_IP:54321
EOF
```

Или обновите `public/env.js` для runtime конфигурации.

### Порты:

- **3000** - Приложение (Docker контейнер)
- **54321** - Supabase API
- **54322** - PostgreSQL (прямое подключение)
- **54323** - Supabase Studio
- **80/443** - Nginx (публичный доступ)

### Решение проблем:

#### Приложение не запускается

```bash
# Проверьте логи
sudo journalctl -u inventory-app-production.service -n 50

# Проверьте Docker контейнер
docker ps -a
docker logs inventory-app-frontend

# Пересоберите образ
docker compose -f docker-compose.yml build app
```

#### Supabase не запускается

```bash
# Проверьте логи
sudo journalctl -u supabase.service -n 50

# Проверьте статус
supabase status

# Перезапустите
supabase stop
supabase start
```

#### Nginx не проксирует правильно

```bash
# Проверьте конфигурацию
sudo nginx -t

# Проверьте логи
sudo tail -f /var/log/nginx/error.log

# Перезагрузите конфигурацию
sudo systemctl reload nginx
```

