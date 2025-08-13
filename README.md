# Inventory App 

Inventory App — приложение на React, которое помогает командам вести единый учёт объектов, оборудования, задач и переписки.

[![Build](https://github.com/devyjones991-ai/inventory-app/actions/workflows/supabase-migrate.yml/badge.svg)](https://github.com/devyjones991-ai/inventory-app/actions)
[![Coverage](https://img.shields.io/codecov/c/github/devyjones991-ai/inventory-app)](https://codecov.io/gh/devyjones991-ai/inventory-app)
[![License](https://img.shields.io/github/license/devyjones991-ai/inventory-app)](LICENSE)


Все данные хранятся в [Supabase](https://supabase.com/), что обеспечивает удобный доступ и совместную работу без необходимости управлять собственной инфраструктурой.

Приложение ориентировано на небольшие команды и организации, которым нужен единый инструмент учёта.

## Структура таблиц
- **objects**: `id`, `name`, `description`, `created_at`
- **hardware**: `id`, `object_id`, `name`, `location`, `purchase_status`, `install_status`, `created_at`
- **tasks**: `id`, `object_id`, `title`, `status`, `assignee`, `due_date`, `notes`, `created_at`
- **chat_messages**: `id`, `object_id`, `sender`, `content`, `file_url`, `created_at`, `read_at`

Подробные схемы данных с перечислением обязательных и необязательных полей, форматов дат и допустимых значений находятся в [docs/api/openapi.yaml](docs/api/openapi.yaml).

## Запуск
1. Зарегистрируйтесь на [Supabase](https://supabase.com) и создайте проект.
2. В настройках проекта откройте `Settings → API`.
3. Скопируйте `URL` проекта и `anon`-ключ.
4. Скопируйте файл `.env.example` в `.env` и заполните `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
5. Установите зависимости: `npm install`.

### Инициализация базы данных

- Откройте Supabase SQL Editor и выполните `supabase/migrations/*.sql` (или готовый `init.sql`).
- Либо установите и авторизуйте Supabase CLI, затем выполните `supabase db push` из корня проекта.
6. Старт разработки: `npm run dev`.
7. Запуск тестов: `npm test`.

### Применение миграции `profiles`

Файл `supabase/migrations/*_create_profiles_table.sql` создаёт таблицу `profiles`,
функцию `handle_new_user()` и триггер для автоматического добавления записей.
Чтобы применить миграцию:

1. Установите и авторизуйте Supabase CLI.
2. Выполните в корне проекта:

 ```bash
 supabase db push
 ```

Миграция создаст необходимые объекты в базе.

### Назначение администраторских прав

1. Авторизуйтесь в Supabase через CLI или веб‑интерфейс.
2. Выполните SQL‑запрос:

 ```sql
 update profiles
 set role = 'admin'
 where id = '<uuid>';
 ```

3. Пользователь должен заново войти в приложение, чтобы новая роль вступила в силу.

Если переменные окружения из пункта 4 не заданы, приложение запускается в ограниченном режиме: на экране появится уведомление о необходимости настроить `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`, а обращения к базе данных будут отклонены.

## Сборка
- Сборка: `npm run build`
- Предпросмотр: `npm run preview`

## Деплой

### Чек-лист перед деплоем