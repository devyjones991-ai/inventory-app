#!/bin/bash
# Скрипт для проверки и исправления роли superuser

set -e

EMAIL="${1:-devyjones991@gmail.com}"

echo "🔍 Проверка и исправление роли superuser для: $EMAIL"
echo ""

# Проверка Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI не установлен"
    echo "   Установите: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Проверка статуса Supabase
echo "1. Проверка статуса Supabase..."
if ! supabase status &> /dev/null; then
    echo "   ⚠ Supabase не запущен, запускаю..."
    supabase start
fi

echo ""
echo "2. Проверка роли пользователя в базе данных..."

# SQL запрос для проверки и исправления роли
SQL_QUERY=$(cat <<EOF
-- Проверяем текущую роль
SELECT 
    id,
    email,
    role,
    permissions,
    created_at
FROM auth.users
WHERE email = '${EMAIL}';

-- Проверяем профиль
SELECT 
    p.id,
    p.email,
    p.role,
    p.permissions,
    p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = '${EMAIL}';

-- Обновляем роль на superuser, если нужно
UPDATE public.profiles
SET 
    role = 'superuser',
    permissions = (
        SELECT jsonb_agg(p.id)
        FROM (
            VALUES
                ('manage_objects'),
                ('manage_users'),
                ('manage_tasks'),
                ('manage_hardware'),
                ('view_reports'),
                ('export_data'),
                ('import_data')
        ) AS p(id)
    ),
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM auth.users WHERE email = '${EMAIL}'
)
AND role != 'superuser';

-- Проверяем результат
SELECT 
    p.id,
    p.email,
    p.role,
    p.permissions,
    CASE 
        WHEN p.role = 'superuser' THEN '✅ Superuser установлен'
        ELSE '❌ Роль не superuser'
    END as status
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = '${EMAIL}';
EOF
)

# Выполняем SQL через Supabase CLI
echo ""
echo "3. Выполнение SQL запросов..."
echo ""

supabase db execute "$SQL_QUERY" || {
    echo ""
    echo "⚠ Не удалось выполнить через db execute, пробую через psql..."
    
    # Получаем connection string
    DB_URL=$(supabase status --output json 2>/dev/null | grep -oP '"DB URL":\s*"\K[^"]+' || echo "")
    
    if [ -z "$DB_URL" ]; then
        echo "❌ Не удалось получить DB URL"
        exit 1
    fi
    
    echo "$SQL_QUERY" | psql "$DB_URL" || {
        echo "❌ Ошибка выполнения SQL"
        exit 1
    }
}

echo ""
echo "4. Проверка функции is_superuser()..."
echo ""

TEST_SQL=$(cat <<EOF
-- Тестируем функцию is_superuser для пользователя
SELECT 
    u.email,
    p.role,
    public.is_superuser(u.id) as is_superuser_result
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = '${EMAIL}';
EOF
)

supabase db execute "$TEST_SQL" || echo "$TEST_SQL" | psql "$DB_URL" 2>/dev/null || echo "⚠ Не удалось протестировать функцию"

echo ""
echo "✅ Проверка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Обновите страницу в браузере"
echo "   2. Войдите заново, если нужно"
echo "   3. Проверьте вкладку 'Администрирование' в настройках профиля"
echo ""
echo "💡 Если роль все еще не отображается:"
echo "   - Проверьте консоль браузера (F12) на ошибки"
echo "   - Убедитесь, что RLS политики позволяют читать профиль"
echo "   - Попробуйте выполнить: supabase db reset"

