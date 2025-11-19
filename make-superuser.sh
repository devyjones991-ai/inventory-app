#!/bin/bash
# Скрипт для назначения суперпользователя
# Использование: ./make-superuser.sh <email>

if [ -z "$1" ]; then
    echo "Использование: ./make-superuser.sh <email>"
    echo "Пример: ./make-superuser.sh user@example.com"
    exit 1
fi

EMAIL="$1"

echo "=== Назначение суперпользователя ==="
echo "Email: $EMAIL"

cd ~/inventory-app

# Проверяем, что Supabase запущен
if ! supabase status 2>/dev/null | grep -q "API URL"; then
    echo "⚠ Supabase не запущен!"
    echo "  Запустите: supabase start"
    exit 1
fi

# Получаем connection string
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Проверяем, существует ли пользователь
USER_EXISTS=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM auth.users WHERE email = '$EMAIL';")

if [ "$USER_EXISTS" -eq "0" ]; then
    echo "✗ Пользователь с email $EMAIL не найден!"
    echo "  Сначала зарегистрируйтесь в приложении"
    exit 1
fi

# Назначаем superuser напрямую через SQL (только для первого назначения)
echo "Назначение роли superuser..."
psql "$DB_URL" <<EOF
-- Обновляем роль на superuser
UPDATE public.profiles 
SET role = 'superuser', updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = '$EMAIL');

-- Проверяем результат
SELECT 
    p.email, 
    p.role, 
    CASE 
        WHEN p.role = 'superuser' THEN '✓ Назначен superuser'
        ELSE '✗ Ошибка назначения'
    END as status
FROM public.profiles p
WHERE p.id = (SELECT id FROM auth.users WHERE email = '$EMAIL');
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Готово! Пользователь $EMAIL теперь superuser"
    echo ""
    echo "Права superuser:"
    echo "  - Полный доступ ко всем объектам"
    echo "  - Управление всеми пользователями"
    echo "  - Назначение ролей другим пользователям"
    echo "  - Обход всех RLS политик"
else
    echo "✗ Ошибка при назначении superuser"
    exit 1
fi

