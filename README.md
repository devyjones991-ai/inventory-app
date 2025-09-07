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

### Миграции БД

- Выполните SQL из `supabase/migrations/*.sql` через Supabase SQL Editor или используйте Supabase CLI:

```bash
supabase db push
```

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
