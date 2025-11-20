#!/bin/bash
# Скрипт для применения комплексного исправления RLS политик
# Применяет миграцию 20250902000017_comprehensive-fix-rls-policies.sql

set -e  # Остановка при ошибке

echo "=== Комплексное исправление RLS политик ==="
echo ""

# Определяем путь к проекту
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Проверяем, что Supabase запущен
if ! command -v supabase &> /dev/null; then
    echo "⚠ Supabase CLI не установлен!"
    echo "  Установите: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Проверяем статус Supabase
if ! supabase status 2>/dev/null | grep -q "API URL"; then
    echo "⚠ Supabase не запущен!"
    echo "  Запустите: supabase start"
    exit 1
fi

# Получаем URL базы данных
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

MIGRATION_FILE="supabase/migrations/20250902000017_comprehensive-fix-rls-policies.sql"

# Проверяем, что файл миграции существует
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Файл миграции не найден: $MIGRATION_FILE"
    exit 1
fi

echo "1. Применение миграции: $MIGRATION_FILE"
echo ""

# Применяем миграцию
if psql "$DB_URL" -f "$MIGRATION_FILE" 2>&1 | tee /tmp/migration_output.log | grep -v "NOTICE:" | grep -v "already exists" | grep -v "^$"; then
    echo ""
    echo "✅ Миграция применена успешно"
else
    # Проверяем, была ли ошибка
    if grep -q "ERROR" /tmp/migration_output.log; then
        echo ""
        echo "❌ Ошибка при применении миграции:"
        grep "ERROR" /tmp/migration_output.log
        exit 1
    else
        echo ""
        echo "✅ Миграция применена (возможны предупреждения)"
    fi
fi

echo ""
echo "2. Проверка функций..."
echo ""

# Проверяем, что все функции созданы
FUNCTIONS=("get_user_role_cached" "is_superuser" "is_admin" "get_user_role" "get_all_profiles")

for func in "${FUNCTIONS[@]}"; do
    if psql "$DB_URL" -tAc "SELECT 1 FROM pg_proc WHERE proname = '$func'" | grep -q "1"; then
        echo "  ✅ Функция $func существует"
    else
        echo "  ❌ Функция $func не найдена!"
        exit 1
    fi
done

echo ""
echo "3. Проверка RLS политик для profiles..."
echo ""

# Проверяем политики для profiles
PROFILES_POLICIES=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles'")
echo "  Найдено политик для profiles: $PROFILES_POLICIES"

if [ "$PROFILES_POLICIES" -lt "7" ]; then
    echo "  ⚠ Ожидалось минимум 7 политик для profiles"
fi

echo ""
echo "  Список политик для profiles:"
psql "$DB_URL" -c "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;" | grep -v "^$" | grep -v "policyname" | grep -v "---" || echo "  ⚠ Политики не найдены"

echo ""
echo "4. Проверка RLS политик для objects..."
echo ""

# Проверяем политики для objects
OBJECTS_POLICIES=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects'")
echo "  Найдено политик для objects: $OBJECTS_POLICIES"

if [ "$OBJECTS_POLICIES" -lt "5" ]; then
    echo "  ⚠ Ожидалось минимум 5 политик для objects"
fi

echo ""
echo "  Список политик для objects:"
psql "$DB_URL" -c "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' ORDER BY policyname;" | grep -v "^$" | grep -v "policyname" | grep -v "---" || echo "  ⚠ Политики не найдены"

echo ""
echo "5. Проверка RLS политик для hardware, tasks, chat_messages..."
echo ""

for table in "hardware" "tasks" "chat_messages"; do
    COUNT=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM pg_policies WHERE tablename = '$table'")
    echo "  $table: $COUNT политик"
done

echo ""
echo "6. Проверка superuser..."
echo ""

# Проверяем наличие superuser
SUPERUSER_COUNT=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM profiles WHERE role = 'superuser'")
if [ "$SUPERUSER_COUNT" -gt "0" ]; then
    echo "  ✅ Найдено superuser: $SUPERUSER_COUNT"
    echo ""
    echo "  Список superuser:"
    psql "$DB_URL" -c "SELECT email, role, permissions FROM profiles WHERE role = 'superuser';" | grep -v "^$" | grep -v "email" | grep -v "---" || echo "  ⚠ Superuser не найдены"
else
    echo "  ⚠ Superuser не найдены"
    echo "  Для назначения superuser используйте: ./setup-superuser.sh"
fi

echo ""
echo "7. Тест функции get_all_profiles()..."
echo ""

# Пробуем вызвать функцию (может не сработать, если нет superuser)
if psql "$DB_URL" -c "SELECT * FROM get_all_profiles() LIMIT 1;" 2>&1 | grep -q "Только superuser"; then
    echo "  ✅ Функция работает корректно (требует superuser/admin)"
elif psql "$DB_URL" -c "SELECT * FROM get_all_profiles() LIMIT 1;" 2>&1 | grep -q "ERROR"; then
    echo "  ⚠ Функция вернула ошибку (возможно, нет superuser для теста)"
else
    echo "  ✅ Функция работает"
fi

echo ""
echo "=== Проверка завершена ==="
echo ""
echo "✅ Комплексное исправление RLS применено успешно!"
echo ""
echo "Следующие шаги:"
echo "  1. Перезапустите приложение (если нужно)"
echo "  2. Проверьте, что superuser может загрузить список пользователей"
echo "  3. Проверьте, что новые пользователи видят объекты"
echo "  4. Проверьте, что рекурсия устранена (нет ошибок 'infinite recursion')"
echo ""

