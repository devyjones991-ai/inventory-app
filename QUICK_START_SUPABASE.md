# Быстрый старт: Локальный Supabase на Linux сервере

## Установка за 3 шага

### 1. Установите Supabase CLI и запустите сервисы

```bash
# На Linux сервере выполните:
bash setup-supabase-local.sh
```

Скрипт автоматически:
- Проверит Docker
- Установит Supabase CLI
- Инициализирует проект (если нужно)
- Запустит локальный Supabase
- Применит все миграции
- Создаст .env.local с конфигурацией

### 2. Получите конфигурацию

```bash
supabase status
```

Вы увидите:
- **API URL** (например: `http://127.0.0.1:54321`)
- **anon key** (JWT токен для клиента)
- **service_role key** (для админских операций)

### 3. Настройте приложение

Скрипт создаст `.env.local` автоматически. Если нужно обновить вручную:

```bash
# Обновите .env или public/env.js с полученными значениями
VITE_SUPABASE_URL=http://YOUR_SERVER_IP:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Важно:** Если приложение доступно извне, замените `127.0.0.1` на IP адрес сервера.

## Проверка работы

```bash
# Проверить статус
supabase status

# Открыть Supabase Studio (веб-интерфейс)
# Доступен на http://YOUR_SERVER_IP:54323
```

## Полезные команды

```bash
supabase start          # Запустить Supabase
supabase stop           # Остановить Supabase
supabase restart        # Перезапустить
supabase db reset       # Сбросить БД и применить миграции
supabase db push        # Применить новые миграции
supabase status         # Показать конфигурацию
```

## Порты

- **54321** - Supabase API (REST API)
- **54322** - PostgreSQL (прямое подключение)
- **54323** - Supabase Studio (веб-интерфейс)
- **54324** - Inbucket (тестовый email сервер)

## Интеграция с docker-compose.yml

Если используете локальный Supabase, **не запускайте** сервисы `postgres` и `postgrest` из docker-compose.yml:

```bash
# Остановите их, если запущены
docker-compose stop postgres postgrest

# Или закомментируйте их в docker-compose.yml
```

Supabase включает в себя PostgreSQL и PostgREST, поэтому они не нужны отдельно.

## Подробная документация

См. [SUPABASE_LINUX_SETUP.md](./SUPABASE_LINUX_SETUP.md) для детальной инструкции.

