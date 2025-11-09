# Установка локального Supabase на Linux сервере

## Требования

- Linux сервер (Ubuntu/Debian/CentOS)
- Docker и Docker Compose установлены
- Права sudo для установки

## Шаг 1: Установка Docker (если не установлен)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Перезайдите в систему или выполните:
newgrp docker
```

## Шаг 2: Установка Supabase CLI

```bash
# Определяем архитектуру
ARCH=$(uname -m)
case $ARCH in
    x86_64) ARCH="amd64" ;;
    aarch64) ARCH="arm64" ;;
    *) echo "Неподдерживаемая архитектура: $ARCH"; exit 1 ;;
esac

# Скачиваем последнюю версию
VERSION="1.200.0"
DOWNLOAD_URL="https://github.com/supabase/cli/releases/download/v${VERSION}/supabase_linux_${ARCH}.tar.gz"

# Устанавливаем
curl -L "$DOWNLOAD_URL" -o /tmp/supabase.tar.gz
sudo tar -xzf /tmp/supabase.tar.gz -C /usr/local/bin supabase
sudo chmod +x /usr/local/bin/supabase
rm /tmp/supabase.tar.gz

# Проверка установки
supabase --version
```

## Шаг 3: Клонирование/переход в проект

```bash
# Если проект уже на сервере, перейдите в директорию
cd /path/to/inventory-app

# Или клонируйте репозиторий
git clone <your-repo-url>
cd inventory-app
```

## Шаг 4: Инициализация Supabase (если еще не инициализирован)

```bash
# Проверка наличия конфига
if [ ! -f "supabase/config.toml" ]; then
    supabase init
fi
```

## Шаг 5: Запуск локального Supabase

```bash
# Запуск всех сервисов Supabase (PostgreSQL, API, Auth, Storage и т.д.)
supabase start

# Это может занять несколько минут при первом запуске
# Скачиваются Docker образы и настраиваются сервисы
```

## Шаг 6: Получение конфигурации

```bash
# Получить URL и ключи
supabase status

# Вывод будет содержать:
# - API URL (например: http://127.0.0.1:54321)
# - anon key (JWT токен)
# - service_role key
# - DB URL
```

## Шаг 7: Применение миграций

```bash
# Применить все миграции из supabase/migrations/
supabase db reset

# Или только применить новые миграции
supabase db push
```

## Шаг 8: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# Получите значения из supabase status
SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')

# Создайте .env файл
cat > .env << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_API_BASE_URL=$SUPABASE_URL
EOF
```

Или обновите `public/env.js`:

```javascript
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: "http://YOUR_SERVER_IP:54321",
  VITE_SUPABASE_ANON_KEY: "YOUR_ANON_KEY",
  VITE_API_BASE_URL: "http://YOUR_SERVER_IP:54321",
};
```

**Важно:** Замените `YOUR_SERVER_IP` на IP адрес вашего сервера, если приложение будет доступно извне.

## Шаг 9: Проверка работы

```bash
# Проверить статус всех сервисов
supabase status

# Открыть Supabase Studio (веб-интерфейс)
# По умолчанию доступен на http://127.0.0.1:54323
# Для доступа снаружи используйте IP сервера: http://YOUR_SERVER_IP:54323
```

## Полезные команды

```bash
# Остановить Supabase
supabase stop

# Перезапустить Supabase
supabase restart

# Посмотреть логи
supabase logs

# Сбросить БД и применить миграции заново
supabase db reset

# Создать новую миграцию
supabase migration new migration_name

# Применить миграции
supabase db push
```

## Порты по умолчанию

- **54321** - API URL (Supabase REST API)
- **54322** - PostgreSQL порт
- **54323** - Supabase Studio (веб-интерфейс)
- **54324** - Inbucket (тестовый email сервер)

## Настройка для production

Для production использования рекомендуется:

1. Настроить reverse proxy (nginx) для Supabase API
2. Настроить SSL сертификаты
3. Изменить порты в `supabase/config.toml` если нужно
4. Настроить бэкапы БД
5. Настроить мониторинг

## Интеграция с docker-compose.yml

Если вы хотите использовать Supabase вместе с вашим docker-compose.yml, можно:

1. Оставить Supabase отдельно (рекомендуется) - Supabase CLI управляет своими контейнерами
2. Или интегрировать в docker-compose.yml, но это сложнее

Рекомендуется использовать Supabase CLI отдельно, так как он управляет всеми зависимостями автоматически.

## Решение проблем

### Проблема: Порты заняты

```bash
# Проверить какие порты заняты
sudo netstat -tulpn | grep -E '54321|54322|54323'

# Остановить конфликтующие сервисы или изменить порты в supabase/config.toml
```

### Проблема: Недостаточно прав

```bash
# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

### Проблема: Миграции не применяются

```bash
# Проверить статус миграций
supabase migration list

# Применить вручную
supabase db push
```

