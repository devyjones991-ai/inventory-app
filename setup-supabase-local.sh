#!/bin/bash
# Скрипт установки и настройки локального Supabase на Linux сервере

set -e  # Остановка при ошибке

echo "=== Установка локального Supabase на Linux ==="

# Проверка наличия Docker
echo -e "\n[1/6] Проверка Docker..."
if command -v docker &> /dev/null; then
    echo "✓ Docker найден: $(docker --version)"
    docker ps > /dev/null 2>&1 || {
        echo "⚠ Docker не запущен или нет прав. Попробуйте: sudo usermod -aG docker \$USER && newgrp docker"
    }
else
    echo "✗ Docker не найден! Установите Docker:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

# Проверка наличия Docker Compose
if docker compose version &> /dev/null || command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose найден"
else
    echo "✗ Docker Compose не найден!"
    exit 1
fi

# Установка Supabase CLI
echo -e "\n[2/6] Установка Supabase CLI..."

# Проверка, установлен ли уже
if command -v supabase &> /dev/null; then
    echo "✓ Supabase CLI уже установлен: $(supabase --version)"
else
    echo "Установка Supabase CLI..."
    
    # Определяем архитектуру
    ARCH=$(uname -m)
    case $ARCH in
        x86_64) ARCH="amd64" ;;
        aarch64) ARCH="arm64" ;;
        *) echo "✗ Неподдерживаемая архитектура: $ARCH"; exit 1 ;;
    esac
    
    # Скачиваем и устанавливаем
    VERSION="1.200.0"
    DOWNLOAD_URL="https://github.com/supabase/cli/releases/download/v${VERSION}/supabase_linux_${ARCH}.tar.gz"
    
    echo "Загрузка Supabase CLI v${VERSION}..."
    curl -L "$DOWNLOAD_URL" -o /tmp/supabase.tar.gz
    
    # Распаковываем в /usr/local/bin
    sudo tar -xzf /tmp/supabase.tar.gz -C /usr/local/bin supabase
    sudo chmod +x /usr/local/bin/supabase
    
    echo "✓ Supabase CLI установлен в /usr/local/bin/supabase"
    rm -f /tmp/supabase.tar.gz
    
    # Проверка установки
    if command -v supabase &> /dev/null; then
        echo "✓ Supabase CLI: $(supabase --version)"
    else
        echo "⚠ Добавьте /usr/local/bin в PATH или перезайдите в систему"
    fi
fi

# Инициализация Supabase (если еще не инициализирован)
echo -e "\n[3/6] Проверка инициализации Supabase..."
if [ -f "supabase/config.toml" ]; then
    echo "✓ Supabase уже инициализирован"
else
    echo "Инициализация Supabase проекта..."
    supabase init
    echo "✓ Supabase инициализирован"
fi

# Проверка, запущен ли уже Supabase
echo -e "\n[4/6] Проверка статуса Supabase..."
if supabase status 2>/dev/null | grep -q "API URL"; then
    echo "✓ Supabase уже запущен"
    read -p "Перезапустить Supabase? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Остановка Supabase..."
        supabase stop || true
        echo "Запуск Supabase..."
        supabase start
    fi
else
    # Запуск локального Supabase
    echo -e "\n[5/6] Запуск локального Supabase..."
    echo "⚠ Это может занять несколько минут при первом запуске (скачивание образов)..."
    supabase start
fi

# Получение конфигурации
echo -e "\n[6/6] Получение конфигурации..."
echo "=== Конфигурация локального Supabase ==="
supabase status

# Применение миграций
echo -e "\nПрименение миграций из supabase/migrations/..."
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
    supabase db reset
    echo "✓ Миграции применены"
else
    echo "⚠ Папка миграций пуста или не найдена"
fi

# Создание .env файла с конфигурацией
echo -e "\nСоздание .env файла..."
API_URL=$(supabase status 2>/dev/null | grep "API URL" | awk '{print $3}' || echo "")
ANON_KEY=$(supabase status 2>/dev/null | grep "anon key" | awk '{print $3}' || echo "")

if [ -n "$API_URL" ] && [ -n "$ANON_KEY" ]; then
    cat > .env.local << EOF
# Локальный Supabase конфигурация
# Сгенерировано автоматически скриптом setup-supabase-local.sh

VITE_SUPABASE_URL=$API_URL
VITE_SUPABASE_ANON_KEY=$ANON_KEY
VITE_API_BASE_URL=$API_URL
EOF
    echo "✓ Создан файл .env.local с конфигурацией"
    echo ""
    echo "Содержимое .env.local:"
    cat .env.local
else
    echo "⚠ Не удалось автоматически получить конфигурацию"
    echo "Выполните: supabase status"
    echo "И добавьте значения в .env или public/env.js"
fi

echo -e "\n=== Установка завершена! ==="
echo ""
echo "Полезные команды:"
echo "  supabase status          - Показать статус и конфигурацию"
echo "  supabase stop            - Остановить Supabase"
echo "  supabase restart         - Перезапустить Supabase"
echo "  supabase db reset        - Сбросить БД и применить миграции"
echo "  supabase studio          - Открыть Supabase Studio (веб-интерфейс)"
echo ""
echo "Supabase Studio доступен на: http://localhost:54323"
echo "API доступен на: $API_URL"

