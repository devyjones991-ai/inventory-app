#!/bin/bash
# Скрипт для применения всех миграций и выравнивания проекта

echo "=== Применение всех миграций ==="

cd ~/inventory-app

# 1. Обновляем код
echo "1. Обновление кода из репозитория..."
git pull origin main

# 2. Проверяем, что Supabase запущен
if ! supabase status 2>/dev/null | grep -q "API URL"; then
    echo "⚠ Supabase не запущен!"
    echo "  Запустите: supabase start"
    exit 1
fi

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# 3. Применяем миграции по порядку
echo ""
echo "2. Применение миграций..."

MIGRATIONS=(
    "supabase/migrations/20250902000002_fix-objects-rls-policies.sql"
    "supabase/migrations/20250902000003_add-superuser-role.sql"
    "supabase/migrations/20250902000004_fix-chat-messages-sender-column.sql"
    "supabase/migrations/20250902000005_fix-tasks-hardware-rls-policies.sql"
    "supabase/migrations/20250902000006_protect-superuser-profile.sql"
    "supabase/migrations/20250902000007_add-permissions-to-profiles.sql"
    "supabase/migrations/20250902000008_fix-task-status-constraint.sql"
    "supabase/migrations/20250902000009_fix-profiles-view-policy.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "  Применение: $migration"
        psql "$DB_URL" -f "$migration" 2>&1 | grep -v "NOTICE:" | grep -v "already exists" || true
    else
        echo "  ⚠ Файл не найден: $migration"
    fi
done

# 4. Проверяем структуру таблицы chat_messages
echo ""
echo "3. Проверка структуры chat_messages..."
psql "$DB_URL" -c "\d chat_messages" | grep -E "(sender|user_email)" || echo "  ⚠ Колонки не найдены"

# 5. Проверяем политики RLS для objects
echo ""
echo "4. Проверка RLS политик для objects..."
psql "$DB_URL" -c "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' ORDER BY policyname;"

# 6. Проверяем наличие superuser
echo ""
echo "5. Проверка superuser..."
psql "$DB_URL" -c "SELECT email, role FROM profiles WHERE role = 'superuser';"

echo ""
echo "✅ Миграции применены!"
echo ""
echo "Следующие шаги:"
echo "  1. Если нужно назначить superuser: ./setup-superuser.sh"
echo "  2. Перезапустите Docker контейнер: ./rebuild-docker.sh"
echo "  3. Обновите страницу в браузере (Ctrl+F5)"

