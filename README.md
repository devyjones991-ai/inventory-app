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
- **chat_messages**: `id`, `object_id`, `sender`, `content`, `file_url`, `created_at`

## Запуск
1. Зарегистрируйтесь на [Supabase](https://supabase.com) и создайте проект.
2. В настройках проекта откройте `Settings → API`.
3. Скопируйте `URL` проекта и `anon`-ключ.
4. Скопируйте файл `.env.example` в `.env` и заполните `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
5. Установите зависимости: `npm install`.
6. Старт разработки: `npm run dev`.
7. Запуск тестов: `npm test`.

## Сборка
- Сборка: `npm run build`
- Предпросмотр: `npm run preview`

## Особенности
- Переключение тем интерфейса
- Работа с оборудованием и задачами через модальные окна
- Пример чата для каждого объекта

## CI

При пуше в `main` автоматически выполняется `supabase db push`. Для работы GitHub Actions добавьте в настройках репозитория секреты `SUPABASE_URL` и `SUPABASE_SERVICE_KEY`.

## Что дальше?
- Авторизация и роли пользователей
- Уведомления о задачах по email или Slack
- Импорт/экспорт данных (CSV)
- Мобильная адаптация интерфейса
