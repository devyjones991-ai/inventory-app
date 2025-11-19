#!/bin/bash
# Скрипт для настройки суперпользователя для devyjones991@gmail.com

EMAIL="devyjones991@gmail.com"

echo "=== Настройка суперпользователя ==="
echo "Email: $EMAIL"

cd ~/inventory-app

# 1. Обновляем код
echo ""
echo "1. Обновление кода..."
git pull origin main

# 2. Применяем миграцию для добавления роли superuser
echo ""
echo "2. Применение миграции для superuser..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/migrations/20250902000003_add-superuser-role.sql

if [ $? -ne 0 ]; then
    echo "⚠ Ошибка при применении миграции. Продолжаем..."
fi

# 3. Назначаем superuser
echo ""
echo "3. Назначение superuser для $EMAIL..."
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Проверяем, существует ли пользователь
USER_EXISTS=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM auth.users WHERE email = '$EMAIL';" 2>/dev/null)

if [ "$USER_EXISTS" -eq "0" ]; then
    echo "⚠ Пользователь с email $EMAIL не найден в базе!"
    echo "  Сначала зарегистрируйтесь в приложении, затем запустите этот скрипт снова"
    exit 1
fi

# Назначаем superuser
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
    echo "  ✓ Полный доступ ко всем объектам (обход RLS)"
    echo "  ✓ Управление всеми пользователями"
    echo "  ✓ Назначение ролей другим пользователям"
    echo "  ✓ Доступ ко всем задачам, оборудованию, сообщениям"
    echo ""
    echo "Теперь вы можете:"
    echo "  - Создавать и управлять любыми объектами"
    echo "  - Назначать роли другим пользователям"
    echo "  - Управлять правами доступа"
else
    echo "✗ Ошибка при назначении superuser"
    exit 1
fi

