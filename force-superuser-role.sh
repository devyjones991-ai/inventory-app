#!/bin/bash
# Скрипт для принудительного назначения роли superuser

set -e

EMAIL="${1:-devyjones991@gmail.com}"

echo "🔧 Принудительное назначение роли superuser для: $EMAIL"
echo ""

# Проверка Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI не установлен"
    exit 1
fi

# Проверка статуса Supabase
if ! supabase status &> /dev/null; then
    echo "⚠ Supabase не запущен, запускаю..."
    supabase start
    sleep 5
fi

# Получаем DB URL
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "1. Проверка существования пользователя..."
USER_ID=$(psql "$DB_URL" -tAc "SELECT id FROM auth.users WHERE email = '$EMAIL';" 2>/dev/null || echo "")

if [ -z "$USER_ID" ]; then
    echo "❌ Пользователь с email $EMAIL не найден!"
    echo "   Сначала зарегистрируйтесь в приложении"
    exit 1
fi

echo "   ✓ Пользователь найден: $USER_ID"

echo ""
echo "2. Проверка текущей роли..."
CURRENT_ROLE=$(psql "$DB_URL" -tAc "SELECT role FROM public.profiles WHERE id = '$USER_ID';" 2>/dev/null || echo "не найдено")
echo "   Текущая роль: $CURRENT_ROLE"

echo ""
echo "3. Обновление роли на superuser..."

# SQL для обновления роли
psql "$DB_URL" <<EOF
-- Обновляем роль на superuser
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
WHERE id = '$USER_ID';

-- Проверяем результат
SELECT 
    p.email,
    p.role,
    p.permissions,
    CASE 
        WHEN p.role = 'superuser' THEN '✅ Superuser установлен'
        ELSE '❌ Ошибка: роль не superuser'
    END as status
FROM public.profiles p
WHERE p.id = '$USER_ID';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "4. Проверка функции is_superuser()..."
    psql "$DB_URL" -c "SELECT public.is_superuser('$USER_ID') as is_superuser_result;" 2>/dev/null || echo "⚠ Функция is_superuser не найдена"
    
    echo ""
    echo "✅ Роль superuser успешно установлена!"
    echo ""
    echo "📋 Следующие шаги:"
    echo "   1. Обновите страницу в браузере (Ctrl+Shift+R или Cmd+Shift+R)"
    echo "   2. Выйдите и войдите заново"
    echo "   3. Откройте настройки профиля и проверьте вкладку 'Администрирование'"
    echo ""
    echo "💡 Если роль все еще не отображается:"
    echo "   - Откройте консоль браузера (F12) и проверьте ошибки"
    echo "   - Проверьте, что RLS политики позволяют читать профиль"
    echo "   - Выполните: supabase db reset (это сбросит БД и применит все миграции)"
else
    echo "❌ Ошибка при обновлении роли"
    exit 1
fi

