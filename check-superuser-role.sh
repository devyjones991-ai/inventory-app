#!/bin/bash
# Скрипт для проверки роли superuser и диагностики проблем

echo "=== Проверка роли superuser ==="
echo ""

cd ~/inventory-app

# 1. Проверяем, что Supabase запущен
if ! supabase status 2>/dev/null | grep -q "API URL"; then
    echo "⚠ Supabase не запущен!"
    echo "  Запустите: supabase start"
    exit 1
fi

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# 2. Проверяем роль пользователя
echo "1. Проверка роли пользователя devyjones991@gmail.com:"
psql "$DB_URL" -c "SELECT id, email, role, permissions FROM profiles WHERE email = 'devyjones991@gmail.com';"

echo ""
echo "2. Проверка функции is_superuser():"
psql "$DB_URL" -c "
SELECT 
  p.email,
  p.role,
  public.is_superuser(p.id) as is_superuser_result
FROM profiles p
WHERE p.email = 'devyjones991@gmail.com';
"

echo ""
echo "3. Проверка RLS политик для profiles:"
psql "$DB_URL" -c "
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
"

echo ""
echo "4. Проверка, может ли пользователь читать свой профиль:"
psql "$DB_URL" -c "
-- Получаем ID пользователя
DO \$\$
DECLARE
  user_id_val UUID;
  role_val TEXT;
BEGIN
  SELECT id INTO user_id_val FROM profiles WHERE email = 'devyjones991@gmail.com';
  
  IF user_id_val IS NULL THEN
    RAISE NOTICE 'Пользователь не найден!';
    RETURN;
  END IF;
  
  -- Проверяем, может ли пользователь читать свой профиль
  SELECT role INTO role_val 
  FROM profiles 
  WHERE id = user_id_val;
  
  IF role_val IS NULL THEN
    RAISE NOTICE 'Не удалось прочитать роль (возможно, проблема с RLS)';
  ELSE
    RAISE NOTICE 'Роль пользователя: %', role_val;
  END IF;
END \$\$;
"

echo ""
echo "5. Применение миграции для исправления политик (если нужно):"
if [ -f "supabase/migrations/20250902000009_fix-profiles-view-policy.sql" ]; then
    echo "  Применение: supabase/migrations/20250902000009_fix-profiles-view-policy.sql"
    psql "$DB_URL" -f "supabase/migrations/20250902000009_fix-profiles-view-policy.sql" 2>&1 | grep -v "NOTICE:" || true
else
    echo "  ⚠ Файл миграции не найден!"
fi

echo ""
echo "=== Проверка завершена ==="
echo ""
echo "Если роль не 'superuser', выполните:"
echo "  psql \"$DB_URL\" -c \"UPDATE profiles SET role = 'superuser' WHERE email = 'devyjones991@gmail.com';\""

