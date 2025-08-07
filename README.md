# Inventory App
 
Inventory App — приложение на React, которое помогает командам вести единый учёт объектов, оборудования, задач и переписки.

Все данные хранятся в [Supabase](https://supabase.com/), что обеспечивает удобный доступ и совместную работу без необходимости управлять собственной инфраструктурой.

Приложение ориентировано на небольшие команды и организации, которым нужен единый инструмент учёта.

## Структура таблиц
- **objects**: `id`, `name`, `description`, `created_at`
- **hardware**: `id`, `object_id`, `name`, `location`, `purchase_status`, `install_status`, `created_at`
- **tasks**: `id`, `object_id`, `title`, `status`, `assignee`, `due_date`, `notes`, `created_at`
- **chat_messages**: `id`, `object_id`, `sender`, `content`, `file_url`, `created_at`

## Запуск
1. Установите зависимости: `npm install`
2. Создайте файл `.env` и добавьте ключи Supabase `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
3. Старт разработки: `npm run dev`
4. Запуск тестов: `npm test`

## Сборка
- Сборка: `npm run build`
- Предпросмотр: `npm run preview`

## Особенности
- Переключение тем интерфейса
- Работа с оборудованием и задачами через модальные окна
- Пример чата для каждого объекта

## CI

При пуше в `main` автоматически выполняется `supabase db push`. Для работы GitHub Actions добавьте в настройках репозитория секреты `SUPABASE_URL` и `SUPABASE_SERVICE_KEY`.
