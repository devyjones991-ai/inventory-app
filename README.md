# Inventory App

Inventory App — веб‑приложение на React + Vite с Tailwind CSS и Supabase для учёта объектов, оборудования и задач.

[![Build](https://github.com/devyjones991-ai/inventory-app/actions/workflows/supabase-migrate.yml/badge.svg)](https://github.com/devyjones991-ai/inventory-app/actions)
[![Coverage](https://img.shields.io/codecov/c/github/devyjones991-ai/inventory-app)](https://codecov.io/gh/devyjones991-ai/inventory-app)
[![License](https://img.shields.io/github/license/devyjones991-ai/inventory-app)](LICENSE)

## Запуск

1. Создайте проект в [Supabase](https://supabase.com/).
2. В настройках проекта откройте `Settings → API` и возьмите значения `Project URL` и `anon` key.
3. Скопируйте `.env.example` в `.env` и заполните [переменные окружения](#переменные-окружения).
4. Установите зависимости и запустите приложение:

```bash
npm install
npm run dev
```

VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_BASE_URL=https://<project-ref>.supabase.co
BASE_PATH=/

````

Переменная `BASE_PATH` задаёт базовый путь приложения в Vite. Если её не указывать,
используется значение по умолчанию `/`.

4. Установите зависимости и запустите:

### Миграции БД

- Выполните SQL из `supabase/migrations/*.sql` через Supabase SQL Editor или используйте Supabase CLI:

```bash
supabase db push
````

## Переменные окружения

| Переменная                | Назначение                                                               |
| ------------------------- | ------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`       | URL проекта Supabase                                                     |
| `VITE_SUPABASE_ANON_KEY`  | Анонимный ключ Supabase                                                  |
| `VITE_API_BASE_URL`       | Базовый URL edge‑функций Supabase                                        |
| `INTEGRATION_CRON_SECRET` | Секрет для фонового вызова функции `import-export` (на стороне Supabase) |

## Интеграции и синхронизация

- Edge‑функции `import` и `export` принимают файлы форматов **CSV**, **XLSX** или **XLS** и поддерживают таблицы `tasks`, `hardware`, `financial_transactions`.
- Параметр `columnMapping` — JSON вида `{ "External column": "supabase_field" }`, позволяющий переименовать заголовки.
- Минимальные обязательные поля:
  - `tasks`: `title`, `assignee`, `due_date`, при необходимости `object_id`.
  - `hardware`: `name` (остальные поля необязательны).
  - `financial_transactions`: `amount`, `transaction_date`.
- Веб‑интерфейс отображает кнопки «Импорт задач» и «Экспорт оборудования». Во время операции показывается индикатор выполнения и количество обработанных строк.

### Мастер интеграций

1. Нажмите кнопку «Интеграции» в шапке Dashboard.
2. Выберите источник: **Microsoft Excel** (Graph API) или **Google Sheets** (сервисный аккаунт).
3. Укажите реквизиты доступа:
   - Excel: URL книги (`https://graph.microsoft.com/v1.0/...`), имя листа/диапазона, API‑ключ приложения.
   - Google Sheets: идентификатор таблицы, диапазон и JSON сервисного аккаунта (добавьте аккаунт в список редакторов).
4. Настройте соответствие колонок (`columnMapping`) — список полей для выбранной таблицы подсказывается в мастере.
5. Задайте расписание: ручной запуск, каждый час, ежедневно, еженедельно или собственная cron‑строка. Время хранится в таблице `integration_sync_status` вместе с часовым поясом.

### Фоновая синхронизация

1. В Supabase задайте переменную окружения `INTEGRATION_CRON_SECRET` (Settings → Functions → Environment variables).
2. Создайте задание Scheduler, которое вызывает `POST https://<project>.supabase.co/functions/v1/import-export?action=run` с заголовком `x-cron-secret: <секрет>` и телом:

   ```json
   {
     "integration": "excel_tasks",
     "direction": "import"
   }
   ```

3. Статусы запусков, время последнего успешного обмена и расписание хранятся в `integration_sync_status` и отображаются на панели управления.

### Ограничения

- Файлы должны содержать заголовок на первой строке и быть закодированы в UTF‑8.
- Edge‑функции импортируют данные пакетами по 1000 строк, поэтому крупные файлы разбиваются автоматически.
- Для корректного связывания с объектами добавляйте колонку `object_id` или задавайте сопоставление на шаге мастера интеграции.

## Тестирование

- Юнит‑тесты:

```bash
npm test
```

- E2E‑тесты:

```bash
npm run e2e
```

## Деплой

- Выполните SQL из `supabase/migrations/*.sql` через Supabase SQL Editor или используйте Supabase CLI: `supabase db push`.
  Миграции включают Row Level Security и политики доступа по `object_id`. Для выдачи прав пользователю добавьте запись в `object_members` с нужным `object_id`.

1. Соберите приложение:

```bash
npm run build
```

2. Просмотрите production‑сборку локально:

```bash
npm run preview
```

3. Разместите содержимое каталога `dist` на любом статическом хостинге.

## Документация

- OpenAPI: [`docs/index.html`](docs/index.html)
- Архитектура и настройка: [`docs/setup.md`](docs/setup.md)

## Превью

- Локально после `npm run preview`: [http://localhost:4173](http://localhost:4173)
  Спецификация OpenAPI: `openapi.yaml`. Статическая документация собирается командой `npm run docs:build` и доступна в [`docs/index.html`](docs/index.html).
