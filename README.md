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

## Настройка проекта
1. Скопируйте `.env.example` в `.env` и заполните `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
2. Установите зависимости: `npm install`.
3. Запустите разработку: `npm run dev`.
4. Выполните тесты: `npm test`.
5. Соберите приложение: `npm run build`.

Подробная инструкция: [docs/setup.md](docs/setup.md).

## Особенности
- Переключение тем интерфейса
- Работа с оборудованием и задачами через модальные окна
- Пример чата для каждого объекта

## Импорт/экспорт данных

### Эндпоинты

- `POST /api/import/:table` — загрузка файла CSV/XLSX и добавление записей в таблицу `objects`, `hardware`, `tasks` или `chat_messages`.
- `GET /api/export/:table?format=csv|xlsx` — выгрузка содержимого таблицы в выбранном формате.

### Поддерживаемые форматы

- **CSV** — кодировка UTF‑8, разделитель запятая, первая строка содержит заголовки.
- **XLSX** — один лист с теми же заголовками, что и в CSV.

### Требования к данным

- Заголовки должны совпадать с названиями столбцов соответствующих таблиц.
- Поля `id` и `created_at` можно опустить — они заполняются автоматически.
- Значения `object_id` должны ссылаться на существующие объекты.
- Даты (`due_date`, `created_at`) передаются в формате ISO 8601.

### Ограничения по ролям

- Импорт доступен только пользователям с ролью `admin`.
- Экспорт доступен всем авторизованным пользователям.

### Пример структуры CSV/XLSX

```
object_id,name,location,purchase_status,install_status
1,Принтер,Офис,ordered,installed
```

В файле XLSX используется такой же набор столбцов на первом листе.

## CI

При пуше в `main` автоматически выполняется `supabase db push`. Для работы GitHub Actions добавьте в настройках репозитория секреты `SUPABASE_URL` и `SUPABASE_SERVICE_KEY`.

## Что дальше?
- Авторизация и роли пользователей
- Уведомления о задачах по email или Slack
- Импорт/экспорт данных (CSV)
- Мобильная адаптация интерфейса
