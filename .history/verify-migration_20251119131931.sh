#!/bin/bash
# Скрипт для проверки применения миграции

echo "=== Проверка миграции ==="

cd ~/inventory-app

# Проверка функции
echo "1. Проверка функции handle_new_object:"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\df handle_new_object" 2>/dev/null | grep -q "handle_new_object" && echo "   ✓ Функция существует" || echo "   ✗ Функция не найдена"

# Проверка триггера
echo ""
echo "2. Проверка триггера on_object_created:"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT tgname FROM pg_trigger WHERE tgname = 'on_object_created';" 2>/dev/null | grep -q "on_object_created" && echo "   ✓ Триггер существует" || echo "   ✗ Триггер не найден"

# Проверка таблицы object_members
echo ""
echo "3. Проверка таблицы object_members:"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\dt object_members" 2>/dev/null | grep -q "object_members" && echo "   ✓ Таблица существует" || echo "   ✗ Таблица не найдена"

# Проверка RLS политик
echo ""
echo "4. Проверка RLS политик для objects:"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT policyname FROM pg_policies WHERE tablename = 'objects';" 2>/dev/null | grep -q "Authenticated insert objects" && echo "   ✓ Политика 'Authenticated insert objects' существует" || echo "   ⚠ Политика не найдена"

echo ""
echo "=== Проверка завершена ==="
echo ""
echo "Теперь попробуйте создать объект в приложении"

