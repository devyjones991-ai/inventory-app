# Исправление проблемы с отображением роли superuser

Если вы не видите себя как superuser во вкладке "Администрирование", выполните следующие шаги:

## Быстрое исправление

### На сервере выполните:

```bash
cd ~/inventory-app
git pull origin main
chmod +x force-superuser-role.sh
./force-superuser-role.sh devyjones991@gmail.com
```

Этот скрипт:
1. Проверит существование пользователя
2. Принудительно установит роль `superuser`
3. Установит все необходимые права
4. Проверит результат

## Альтернативный способ (если скрипт не работает)

### 1. Подключитесь к базе данных напрямую:

```bash
supabase db reset  # Это применит все миграции заново
```

### 2. Затем выполните SQL напрямую:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" <<EOF
-- Обновляем роль на superuser
UPDATE public.profiles
SET 
    role = 'superuser',
    permissions = '["manage_objects", "manage_users", "manage_tasks", "manage_hardware", "view_reports", "export_data", "import_data"]'::jsonb,
    updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'devyjones991@gmail.com');

-- Проверяем результат
SELECT email, role, permissions 
FROM public.profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'devyjones991@gmail.com');
EOF
```

## После исправления

1. **Обновите страницу в браузере** (Ctrl+Shift+R или Cmd+Shift+R)
2. **Выйдите и войдите заново** (чтобы обновить сессию)
3. **Откройте настройки профиля** и проверьте вкладку "Администрирование"

## Диагностика

Если роль все еще не отображается:

### 1. Проверьте консоль браузера (F12 → Console)
Ищите ошибки типа:
- "Error checking user profile"
- "RLS policy violation"
- "Cannot read property 'role'"

### 2. Проверьте, что миграции применены:

```bash
supabase migration list
```

Убедитесь, что миграция `20250902000003_add-superuser-role.sql` применена.

### 3. Проверьте RLS политики:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'profiles';
"
```

### 4. Проверьте функцию is_superuser:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
SELECT public.is_superuser((SELECT id FROM auth.users WHERE email = 'devyjones991@gmail.com'));
"
```

Должно вернуть `t` (true).

## Если ничего не помогает

1. Выполните полный сброс базы данных:
   ```bash
   supabase db reset
   ```

2. Примените все миграции заново:
   ```bash
   ./fix-all-migrations.sh
   ```

3. Назначьте роль superuser снова:
   ```bash
   ./force-superuser-role.sh devyjones991@gmail.com
   ```

4. Перезапустите приложение и войдите заново

