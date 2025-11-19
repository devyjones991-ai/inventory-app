# Multiminder

Multiminder — веб‑приложение на React + Vite с Tailwind CSS и Supabase для учёта объектов, оборудования и задач.

[![Build](https://github.com/devyjones991-ai/inventory-app/actions/workflows/supabase-migrate.yml/badge.svg)](https://github.com/devyjones991-ai/inventory-app/actions)
[![Coverage](https://img.shields.io/codecov/c/github/devyjones991-ai/inventory-app)](https://codecov.io/gh/devyjones991-ai/inventory-app)
[![License](https://img.shields.io/github/license/devyjones991-ai/inventory-app)](LICENSE)

## Запуск

**⚠️ Важно: Этот проект использует локальную базу данных Supabase.**

Для настройки локальной БД следуйте инструкциям в [LOCAL_SETUP.md](LOCAL_SETUP.md).

### Быстрый старт с локальной БД

1. Запустите скрипт настройки локального Supabase:

```bash
bash setup-local-supabase.sh
```

Скрипт автоматически:
- ✅ Запустит локальный Supabase
- ✅ Создаст `.env.local` с локальными значениями
- ✅ Применит все миграции БД

2. Установите зависимости и запустите приложение:

```bash
npm install
npm run dev
```

### Миграции БД (локальная БД)

После получения новых миграций из репозитория примените их к локальной БД:

```bash
# Применить все миграции (сбросит БД и применит все миграции заново)
supabase db reset

# Или применить только новые миграции (без потери данных)
supabase db push
```

**Примечание:** `supabase db reset` удалит все данные и применит все миграции заново. 
Используйте `supabase db push` для применения только новых миграций без потери данных.

Подробнее о работе с локальной БД см. [LOCAL_SETUP.md](LOCAL_SETUP.md).

## Переменные окружения

| Переменная               | Назначение                        |
| ------------------------ | --------------------------------- |
| `VITE_SUPABASE_URL`      | URL проекта Supabase              |
| `VITE_SUPABASE_ANON_KEY` | Анонимный ключ Supabase           |
| `VITE_API_BASE_URL`      | Базовый URL edge‑функций Supabase |

## Тестирование

- Юнит‑тесты:

```bash
npm test
```

- E2E‑тесты:

```bash
npm run e2e
```

- Deno‑тесты edge‑функций:

```bash
deno test supabase/functions/**/index.test.ts
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
