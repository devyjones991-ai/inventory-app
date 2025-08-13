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