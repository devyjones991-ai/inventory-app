# 🚀 Развертывание на сервере multiminder.duckdns.org

## ✅ Проблемы исправлены

- ✅ MIME type ошибки для JavaScript модулей
- ✅ Логгер с fallback на console при недоступности API
- ✅ Улучшенная конфигурация Supabase клиента
- ✅ Автоматическая проверка доступности API
- ✅ Улучшенные скрипты развертывания

## 🔧 Подготовка к развертыванию

### 1. На локальной машине (Windows):

```powershell
# Запустите PowerShell от имени администратора
# Перейдите в папку проекта
cd H:\inventory-app

# Запустите скрипт подготовки
.\deploy-enhanced.ps1
```

### 2. На сервере (Ubuntu/Debian):

```bash
# Клонируйте репозиторий
git clone https://github.com/devyjones991-ai/inventory-app.git
cd inventory-app

# Установите зависимости
npm install

# Запустите автоматическое развертывание
chmod +x deploy-enhanced.sh
./deploy-enhanced.sh
```

## 🌐 Настройка nginx

### Для HTTP (без SSL):

```bash
sudo cp nginx-http.conf /etc/nginx/sites-available/multiminder.duckdns.org
```

### Для HTTPS (с SSL):

```bash
sudo cp nginx.conf /etc/nginx/sites-available/multiminder.duckdns.org
```

## 🔒 Настройка SSL сертификата

```bash
# Установите certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Получите SSL сертификат
sudo certbot --nginx -d multiminder.duckdns.org

# Проверьте статус сертификата
sudo certbot certificates
```

## 📋 Переменные окружения

Создайте файл `.env` на сервере:

```env
VITE_SUPABASE_URL=https://ldbdqkbstlhugikalpin.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmRxa2JzdGxodWdpa2FscGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzA4OTIsImV4cCI6MjA2OTM0Njg5Mn0.V9V20mwbCzfWYXn2HZGyjWRhFiu6TW0uw_s-WiiipTg
VITE_API_BASE_URL=https://multiminder.duckdns.org/api
```

## 🔍 Диагностика проблем

### 1. Проверьте статус nginx:

```bash
sudo systemctl status nginx
sudo nginx -t
```

### 2. Проверьте логи:

```bash
# Логи nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Логи приложения (если используете Docker)
docker logs <container-name>
```

### 3. Проверьте доступность:

```bash
# HTTP
curl -I http://multiminder.duckdns.org

# HTTPS
curl -I https://multiminder.duckdns.org
```

### 4. Проверьте файлы:

```bash
# Проверьте, что файлы скопированы
ls -la /var/www/multiminder.duckdns.org/

# Проверьте права доступа
ls -la /var/www/multiminder.duckdns.org/assets/
```

## 🐛 Частые проблемы и решения

### MIME type ошибки

```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "application/octet-stream"
```

**Решение:**

1. Убедитесь, что nginx.conf содержит правильные MIME типы
2. Проверьте, что все JS файлы имеют расширение .js (не .jsx)
3. Перезапустите nginx: `sudo systemctl reload nginx`

### CORS ошибки

```
Access to fetch at 'https://ldbdqkbstlhugikalpin.supabase.co' from origin 'https://multiminder.duckdns.org' has been blocked by CORS policy
```

**Решение:**

1. Проверьте настройки CORS в Supabase Dashboard
2. Добавьте домен в список разрешенных origins
3. Убедитесь, что используется правильный URL

### 404 ошибки

```
GET https://multiminder.duckdns.org/assets/index-xxx.js 404 (Not Found)
```

**Решение:**

1. Проверьте, что файлы скопированы в правильную директорию
2. Проверьте права доступа: `sudo chown -R www-data:www-data /var/www/multiminder.duckdns.org/`
3. Проверьте nginx конфигурацию

### Переменные окружения не загружаются

```
Отсутствуют переменные окружения: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

**Решение:**

1. Убедитесь, что .env файл существует и содержит правильные переменные
2. Перезапустите nginx: `sudo systemctl reload nginx`
3. Очистите кэш браузера

## 📊 Мониторинг

### Автоматический мониторинг:

```bash
# Создайте скрипт мониторинга
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
    if ! curl -s http://localhost > /dev/null; then
        echo "$(date): Site is down!" >> /var/log/site-monitor.log
        # Можно добавить уведомления (email, telegram, etc.)
    fi
    sleep 60
done
EOF

chmod +x monitor.sh
nohup ./monitor.sh &
```

## 🔄 Обновление приложения

```bash
# На сервере
cd /path/to/inventory-app
git pull origin main
npm install
./deploy-enhanced.sh
```

## 📞 Поддержка

Если возникают проблемы:

1. Проверьте логи nginx
2. Проверьте статус сервисов
3. Убедитесь, что все файлы на месте
4. Проверьте права доступа
5. Проверьте конфигурацию nginx

**Теперь приложение должно работать стабильно на сервере!** 🎉
