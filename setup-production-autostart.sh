#!/bin/bash
# Скрипт для настройки автозапуска приложения и Supabase на сервере

set -e

echo "=== Настройка автозапуска для production ==="

# Переменные
PROJECT_DIR="/home/bag/inventory-app"
USER="bag"

# Проверка прав
if [ "$EUID" -eq 0 ]; then 
   echo "⚠ Не запускайте скрипт с sudo. Он сам использует sudo где нужно."
   exit 1
fi

cd "$PROJECT_DIR"

# 1. Настройка автозапуска Docker
echo -e "\n[1/6] Настройка автозапуска Docker..."
if ! systemctl is-enabled docker > /dev/null 2>&1; then
    echo "Включение автозапуска Docker..."
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "✓ Docker настроен на автозапуск"
else
    echo "✓ Docker уже настроен на автозапуск"
fi

# 2. Настройка автозапуска Supabase
echo -e "\n[2/6] Настройка автозапуска Supabase..."
if [ ! -f "/usr/local/bin/supabase" ]; then
    echo "⚠ Supabase CLI не найден в /usr/local/bin/supabase"
    echo "Установите его: bash setup-supabase-local.sh"
    exit 1
fi

# Копируем systemd service для Supabase
sudo cp "$PROJECT_DIR/supabase.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable supabase.service
echo "✓ Supabase service настроен"

# 3. Настройка автозапуска приложения (Docker Compose)
echo -e "\n[3/6] Настройка автозапуска приложения..."
# Копируем systemd service для приложения
sudo cp "$PROJECT_DIR/inventory-app-production.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable inventory-app-production.service
echo "✓ Приложение service настроен"

# 4. Настройка nginx
echo -e "\n[4/7] Настройка nginx..."
# Проверяем, установлен ли nginx
if ! command -v nginx &> /dev/null; then
    echo "Установка nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Копируем конфигурацию nginx (HTTP only, без SSL)
NGINX_CONF="/etc/nginx/sites-available/multiminder.duckdns.org"
sudo cp "$PROJECT_DIR/nginx.conf" "$NGINX_CONF"

# Создаем симлинк, если его нет
if [ ! -L "/etc/nginx/sites-enabled/multiminder.duckdns.org" ]; then
    sudo ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/
fi

# Удаляем default конфигурацию, если она активна
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Проверяем конфигурацию nginx
if sudo nginx -t; then
    echo "✓ Конфигурация nginx валидна"
    sudo systemctl enable nginx
    sudo systemctl restart nginx
    echo "✓ Nginx перезапущен"
else
    echo "✗ Ошибка в конфигурации nginx!"
    exit 1
fi

# 4.5. Настройка SSL сертификата
echo -e "\n[4.5/7] Настройка SSL сертификата..."
if [ ! -f "/etc/letsencrypt/live/multiminder.duckdns.org/fullchain.pem" ]; then
    echo "SSL сертификат не найден. Установка certbot..."
    
    # Устанавливаем certbot, если не установлен
    if ! command -v certbot &> /dev/null; then
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    echo ""
    echo "⚠ Для получения SSL сертификата нужен доступ к домену multiminder.duckdns.org"
    echo "⚠ Убедитесь, что домен указывает на IP этого сервера"
    echo ""
    read -p "Продолжить установку SSL сертификата? (y/n): " install_ssl
    
    if [ "$install_ssl" = "y" ] || [ "$install_ssl" = "Y" ]; then
        echo "Получение SSL сертификата через certbot..."
        # Используем --nginx для автоматической настройки nginx
        # --non-interactive для автоматического режима
        # --agree-tos для принятия условий
        # --email можно указать, но для duckdns можно использовать временный
        if sudo certbot --nginx -d multiminder.duckdns.org --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
            echo "✓ SSL сертификат успешно установлен!"
            echo "✓ Nginx автоматически настроен для HTTPS"
        else
            echo "⚠ Не удалось установить SSL сертификат автоматически"
            echo "  Возможные причины:"
            echo "  - Домен не указывает на IP этого сервера"
            echo "  - Порт 80 не доступен извне"
            echo "  - Проблемы с DNS"
            echo ""
            echo "  Вы можете установить SSL позже вручную:"
            echo "  sudo certbot --nginx -d multiminder.duckdns.org"
            echo ""
            echo "  Продолжаем без SSL..."
        fi
    else
        echo "Пропуск установки SSL. Продолжаем без HTTPS..."
    fi
else
    echo "✓ SSL сертификат уже установлен"
    # Обновляем конфигурацию nginx для использования SSL
    echo "Проверка конфигурации nginx с SSL..."
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✓ Nginx настроен для работы с SSL"
    fi
fi

# 5. Настройка переменных окружения для локального Supabase
echo -e "\n[5/7] Настройка переменных окружения..."
# Получаем IP сервера
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(curl -s ifconfig.me || echo "127.0.0.1")
fi

# Получаем конфигурацию Supabase (если запущен)
if supabase status 2>/dev/null | grep -q "API URL"; then
    API_URL=$(supabase status 2>/dev/null | grep "API URL" | awk '{print $3}' | sed "s|127.0.0.1|$SERVER_IP|g")
    ANON_KEY=$(supabase status 2>/dev/null | grep "anon key" | awk '{print $3}')
    
    if [ -n "$API_URL" ] && [ -n "$ANON_KEY" ]; then
        # Обновляем public/env.js для runtime конфигурации
        cat > "$PROJECT_DIR/public/env.js" << EOF
// Runtime environment overrides for static hosting
// Локальный Supabase конфигурация (автоматически настроено)
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: "$API_URL",
  VITE_SUPABASE_ANON_KEY: "$ANON_KEY",
  VITE_API_BASE_URL: "$API_URL",
};
EOF
        echo "✓ Переменные окружения настроены"
        echo "  API URL: $API_URL"
    else
        echo "⚠ Не удалось получить конфигурацию Supabase автоматически"
        echo "  Выполните: supabase status"
        echo "  И обновите public/env.js вручную"
    fi
else
    echo "⚠ Supabase не запущен, переменные окружения не настроены"
    echo "  Запустите: supabase start"
    echo "  Затем обновите public/env.js"
fi

# 6. Запуск сервисов
echo -e "\n[6/7] Запуск сервисов..."
echo "Запуск Supabase..."
sudo systemctl start supabase.service
sleep 10

echo "Запуск приложения..."
# Сначала собираем образ, если нужно
cd "$PROJECT_DIR"
echo "Сборка Docker образа приложения..."
docker compose -f docker-compose.yml build app || echo "⚠ Ошибка сборки, продолжаем..."
sudo systemctl start inventory-app-production.service
sleep 5

# 7. Проверка статуса
echo -e "\n[7/7] Проверка статуса сервисов..."
echo ""
echo "=== Статус сервисов ==="
echo ""
echo "Docker:"
sudo systemctl status docker --no-pager -l | head -3
echo ""
echo "Supabase:"
sudo systemctl status supabase.service --no-pager -l | head -5
echo ""
echo "Приложение:"
sudo systemctl status inventory-app-production.service --no-pager -l | head -5
echo ""
echo "Nginx:"
sudo systemctl status nginx --no-pager -l | head -3

# Проверка доступности
echo ""
echo "=== Проверка доступности ==="
sleep 3

if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 | grep -q "200\|301\|302"; then
    echo "✓ Приложение доступно на localhost:3000"
else
    echo "⚠ Приложение не отвечает на localhost:3000"
fi

# Проверка Supabase (может потребоваться больше времени для запуска)
echo "Ожидание запуска Supabase..."
for i in {1..10}; do
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54321/rest/v1/ | grep -q "200\|401\|404"; then
        echo "✓ Supabase API доступен на localhost:54321"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "⚠ Supabase API не отвечает на localhost:54321"
        echo "  Проверьте статус: supabase status"
        echo "  Проверьте логи: sudo journalctl -u supabase.service -n 50"
    else
        sleep 2
    fi
done

# Проверка HTTP (без SSL)
if curl -s -o /dev/null -w "%{http_code}" http://multiminder.duckdns.org | grep -q "200\|301\|302"; then
    echo "✓ Сайт доступен по http://multiminder.duckdns.org"
else
    echo "⚠ Сайт не отвечает по http://multiminder.duckdns.org"
    echo "  Проверьте nginx: sudo systemctl status nginx"
    echo "  Проверьте логи: sudo tail -f /var/log/nginx/error.log"
fi

# Проверка HTTPS (если SSL установлен)
if [ -f "/etc/letsencrypt/live/multiminder.duckdns.org/fullchain.pem" ]; then
    if curl -s -o /dev/null -w "%{http_code}" https://multiminder.duckdns.org | grep -q "200\|301\|302"; then
        echo "✓ Сайт доступен по https://multiminder.duckdns.org"
    else
        echo "⚠ Сайт не отвечает по https://multiminder.duckdns.org"
    fi
else
    echo "ℹ SSL не установлен, проверка HTTPS пропущена"
fi

echo ""
echo "=== Настройка завершена! ==="
echo ""
echo "Полезные команды:"
echo "  sudo systemctl status supabase.service          - Статус Supabase"
echo "  sudo systemctl status inventory-app-production.service - Статус приложения"
echo "  sudo systemctl status nginx                       - Статус nginx"
echo ""
echo "  sudo systemctl restart supabase.service           - Перезапуск Supabase"
echo "  sudo systemctl restart inventory-app-production.service - Перезапуск приложения"
echo "  sudo systemctl restart nginx                      - Перезапуск nginx"
echo ""
echo "  sudo journalctl -u supabase.service -f           - Логи Supabase"
echo "  sudo journalctl -u inventory-app-production.service -f - Логи приложения"
echo ""
echo "🌐 Сайт: https://multiminder.duckdns.org"
echo "📊 Supabase Studio: http://YOUR_SERVER_IP:54323"

