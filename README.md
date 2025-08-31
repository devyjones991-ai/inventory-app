# Inventory App

Inventory App — веб‑приложение на React + Vite с Tailwind CSS и Supabase для учёта объектов, оборудования и задач.

[![Build](https://github.com/devyjones991-ai/inventory-app/actions/workflows/supabase-migrate.yml/badge.svg)](https://github.com/devyjones991-ai/inventory-app/actions)
[![Coverage](https://img.shields.io/codecov/c/github/devyjones991-ai/inventory-app)](https://codecov.io/gh/devyjones991-ai/inventory-app)
[![License](https://img.shields.io/github/license/devyjones991-ai/inventory-app)](LICENSE)

## Быстрый старт

1. Создайте проект в [Supabase](https://supabase.com/).
2. В настройках проекта откройте `Settings → API` и возьмите значения `Project URL` и `anon` key.
3. Скопируйте `.env.example` в `.env` и заполните:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_BASE_URL=https://<project-ref>.supabase.co
```

4. Установите зависимости и запустите:

```
npm install
npm run dev
```

### Миграции БД

- Выполните SQL из `supabase/migrations/*.sql` через Supabase SQL Editor или используйте Supabase CLI: `supabase db push`.

### Тесты

```
npm test
```

## Сборка

- Production: `npm run build`
- Preview: `npm run preview`

## API

Спецификация OpenAPI: `openapi.yaml`. Сборка документации: `npm run docs:build` (в папку `docs/`).
