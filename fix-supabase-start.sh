#!/bin/bash
# Скрипт для диагностики и исправления проблем с запуском Supabase

set -e

echo "=== Диагностика Supabase ==="

# Проверка установки Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "✗ Supabase CLI не установлен"
    echo "Установите: bash setup-local-supabase.sh"
    exit 1
fi

echo "✓ Supabase CLI установлен"

# Проверка статуса
echo ""
echo "Текущий статус Supabase:"
supabase status || echo "⚠ Не удалось получить статус"

# Проверка портов
echo ""
echo "Проверка портов:"
if netstat -tuln 2>/dev/null | grep -q ":54321"; then
    echo "✓ Порт 54321 занят (Supabase API)"
else
    echo "⚠ Порт 54321 свободен (Supabase не запущен?)"
fi

# Попытка перезапуска
echo ""
read -p "Попытаться перезапустить Supabase? (y/n): " restart_supabase

if [ "$restart_supabase" = "y" ] || [ "$restart_supabase" = "Y" ]; then
    echo "Остановка Supabase..."
    supabase stop || true
    
    echo "Ожидание 3 секунды..."
    sleep 3
    
    echo "Запуск Supabase..."
    supabase start
    
    echo "Ожидание запуска (10 секунд)..."
    sleep 10
    
    echo ""
    echo "Проверка доступности..."
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54321/rest/v1/ | grep -q "200\|401\|404"; then
        echo "✓ Supabase API доступен!"
    else
        echo "⚠ Supabase API все еще не отвечает"
        echo ""
        echo "Проверьте логи:"
        echo "  supabase logs"
        echo "  sudo journalctl -u supabase.service -n 50"
    fi
fi

echo ""
echo "=== Диагностика завершена ==="



