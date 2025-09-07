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
