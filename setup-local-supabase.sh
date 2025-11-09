#!/bin/bash
# Скрипт для настройки полностью локального Supabase
# Удаляет все ссылки на удаленный проект и настраивает локальную БД

set -e

echo "=== Настройка полностью локального Supabase ==="

# 1. Удаление ссылок на удаленный проект
echo -e "\n[1/6] Удаление ссылок на удаленный Supabase..."
if [ -d ".supabase" ]; then
    echo "Удаление директории .supabase..."
    rm -rf .supabase/
    echo "✓ Ссылки на удаленный проект удалены"
else
    echo "✓ Нет ссылок на удаленный проект"
fi

# 2. Проверка Supabase CLI
echo -e "\n[2/6] Проверка Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "✗ Supabase CLI не установлен!"
    echo "Установите его: bash setup-supabase-local.sh"
    exit 1
fi
echo "✓ Supabase CLI: $(supabase --version)"

# 3. Проверка конфигурации
echo -e "\n[3/6] Проверка конфигурации..."
if [ ! -f "supabase/config.toml" ]; then
    echo "✗ Файл supabase/config.toml не найден!"
    echo "Выполните: supabase init"
    exit 1
fi

# Проверяем версию PostgreSQL
if grep -q "major_version = 17" supabase/config.toml; then
    echo "⚠ Обнаружена версия PostgreSQL 17, исправляю на 15..."
    sed -i 's/major_version = 17/major_version = 15/' supabase/config.toml
    echo "✓ Версия PostgreSQL исправлена на 15"
fi

# 4. Остановка и перезапуск Supabase
echo -e "\n[4/6] Перезапуск локального Supabase..."
if supabase status 2>/dev/null | grep -q "API URL"; then
    echo "Остановка Supabase..."
    supabase stop || true
fi

echo "Запуск локального Supabase..."
supabase start

# 5. Получение локальной конфигурации
echo -e "\n[5/6] Получение локальной конфигурации..."
API_URL=$(supabase status 2>/dev/null | grep "API URL" | awk '{print $3}' || echo "http://127.0.0.1:54321")
ANON_KEY=$(supabase status 2>/dev/null | grep "anon key" | awk '{print $3}' || echo "")

if [ -z "$ANON_KEY" ]; then
    echo "⚠ Не удалось получить anon key автоматически"
    echo "Выполните: supabase status"
    echo "И скопируйте значения вручную"
else
    echo "✓ API URL: $API_URL"
    echo "✓ Anon Key получен (длина: ${#ANON_KEY} символов)"
fi

# 6. Создание .env.local с локальными значениями
echo -e "\n[6/6] Создание .env.local..."
cat > .env.local << EOF
# Локальный Supabase конфигурация
# Автоматически сгенерировано скриптом setup-local-supabase.sh
# НЕ коммитьте этот файл в git!

VITE_SUPABASE_URL=$API_URL
VITE_SUPABASE_ANON_KEY=$ANON_KEY
VITE_API_BASE_URL=$API_URL
EOF

echo "✓ Создан файл .env.local"

# 7. Применение миграций
echo -e "\nПрименение миграций к локальной БД..."
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
    echo "Применение миграций..."
    supabase db reset
    echo "✓ Миграции применены"
else
    echo "⚠ Папка миграций пуста или не найдена"
fi

# Итоговая информация
echo -e "\n=== Настройка завершена! ==="
echo ""
echo "Локальный Supabase запущен:"
echo "  API URL: $API_URL"
echo "  Studio: http://127.0.0.1:54323"
echo "  Database: localhost:54322"
echo ""
echo "Конфигурация сохранена в:"
echo "  - .env.local (для разработки)"
echo "  - public/env.js (оставлен пустым, использует .env)"
echo ""
echo "Полезные команды:"
echo "  supabase status          - Показать статус"
echo "  supabase stop             - Остановить"
echo "  supabase restart          - Перезапустить"
echo "  supabase db reset         - Сбросить БД и применить миграции"
echo "  supabase studio           - Открыть веб-интерфейс"
echo ""
echo "⚠ ВАЖНО: .env.local не должен быть в git (уже добавлен в .gitignore)"

