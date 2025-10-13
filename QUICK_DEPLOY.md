# 🚀 Быстрое развертывание на сервере

## Проблемы исправлены ✅

- ✅ MIME type ошибки для JavaScript модулей
- ✅ Все файлы теперь имеют .js расширения
- ✅ Правильная nginx конфигурация
- ✅ CORS заголовки для модулей

## Инструкция для развертывания

### 1. На сервере выполните:

```bash
# Клонируйте репозиторий
git clone https://github.com/devyjones991-ai/inventory-app.git
cd inventory-app

# Установите зависимости
npm install

# Запустите автоматическое развертывание
chmod +x deploy.sh
./deploy.sh
```

### 2. Если нужен HTTPS:

```bash
# Установите certbot
sudo apt install certbot python3-certbot-nginx

# Получите SSL сертификат
sudo certbot --nginx -d multiminder.duckdns.org
```

### 3. Проверьте работу:

```bash
# Проверьте статус nginx
sudo systemctl status nginx

# Проверьте логи
sudo tail -f /var/log/nginx/error.log

# Проверьте доступность
curl -I http://multiminder.duckdns.org
```

## Что исправлено

1. **Vite конфигурация** - принудительно генерирует .js файлы
2. **nginx конфигурация** - правильные MIME типы для JavaScript
3. **CORS заголовки** - для корректной загрузки модулей
4. **Deployment скрипт** - автоматическая проверка и развертывание

## Файлы конфигурации

- `nginx-http.conf` - для HTTP (без SSL)
- `nginx.conf` - для HTTPS (с SSL)
- `deploy.sh` - автоматический скрипт развертывания

**Теперь приложение должно работать без ошибок MIME типов!** 🎉
