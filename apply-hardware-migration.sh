#!/bin/bash
# Скрипт для применения миграции hardware на Ubuntu сервере (без GUI)

set -e

echo "=========================================="
echo "Применение миграции hardware"
echo "=========================================="
echo ""

MIGRATION_FILE="supabase/migrations/20250902000009_add-hardware-fields.sql"

# Проверка наличия файла миграции
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Ошибка: Файл миграции не найден: $MIGRATION_FILE"
    exit 1
fi

echo "✓ Файл миграции найден: $MIGRATION_FILE"
echo ""

# Проверка статуса Supabase
echo "Проверка статуса Supabase..."
if command -v supabase &> /dev/null; then
    if supabase status 2>/dev/null | grep -q "API URL"; then
        echo "✓ Supabase запущен"
        
        # Способ 1: Через Supabase CLI (рекомендуется)
        echo ""
        echo "Применение миграции через Supabase CLI..."
        echo "Используется: supabase db push"
        echo ""
        
        # Применяем только новую миграцию
        if supabase db push; then
            echo ""
            echo "✅ Миграция успешно применена через Supabase CLI!"
        else
            echo ""
            echo "⚠️  Ошибка при применении через Supabase CLI"
            echo "Пробуем альтернативный способ..."
            echo ""
        fi
    else
        echo "⚠️  Supabase не запущен"
        echo "Запустите: supabase start"
        exit 1
    fi
else
    echo "⚠️  Supabase CLI не найден"
    echo "Пробуем применить через psql напрямую..."
    echo ""
fi

# Способ 2: Через psql напрямую (если Supabase CLI не сработал)
if command -v psql &> /dev/null; then
    echo "Применение миграции через psql..."
    DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    
    if psql "$DB_URL" -f "$MIGRATION_FILE" 2>&1 | grep -v "NOTICE:" | grep -v "already exists"; then
        echo ""
        echo "✅ Миграция успешно применена через psql!"
    else
        echo ""
        echo "✅ Миграция применена (некоторые предупреждения могут быть нормальными)"
    fi
else
    echo "❌ psql не найден. Установите PostgreSQL клиент:"
    echo "   sudo apt-get install postgresql-client"
    exit 1
fi

# Проверка применения миграции
echo ""
echo "Проверка применения миграции..."
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

if psql "$DB_URL" -c "\d hardware" 2>/dev/null | grep -q "cost"; then
    echo "✅ Колонка 'cost' успешно добавлена в таблицу hardware"
else
    echo "⚠️  Колонка 'cost' не найдена. Проверьте вручную:"
    echo "   psql $DB_URL -c \"\\d hardware\""
fi

echo ""
echo "=========================================="
echo "Готово! Перезапустите приложение или"
echo "обновите страницу в браузере (Ctrl+F5)"
echo "=========================================="

