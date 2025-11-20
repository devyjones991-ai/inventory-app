# Устранение проблем с входом после настройки HTTPS

## Проблема
После настройки HTTPS не работает вход в приложение.

## Причины
1. **Mixed Content**: Приложение пытается загрузить HTTP ресурсы с HTTPS страницы
2. **Неправильная конфигурация env.js**: URL все еще указывает на HTTP
3. **Проблемы с CORS**: Неправильные заголовки в Nginx
4. **Проблемы с сессиями/куками**: Куки не передаются между HTTP и HTTPS

## Решение

### Шаг 1: Обновление env.js на сервере

```bash
cd ~/inventory-app
git pull origin main
chmod +x fix-env-https.sh
sudo ./fix-env-https.sh
```

Или вручную обновите `/home/bag/inventory-app/public/env.js`:
```javascript
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: "https://multiminder.duckdns.org",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  VITE_API_BASE_URL: "https://multiminder.duckdns.org",
};
```

### Шаг 2: Проверка конфигурации Nginx

```bash
chmod +x fix-nginx-realtime.sh
sudo ./fix-nginx-realtime.sh
```

Убедитесь, что:
- Nginx настроен для HTTPS (порт 443)
- Все location блоки имеют `proxy_set_header X-Forwarded-Proto $scheme;`
- Realtime endpoint имеет `proxy_pass http://127.0.0.1:54321/realtime/v1/;`

### Шаг 3: Пересборка Docker контейнера

```bash
cd ~/inventory-app
./rebuild-docker.sh
```

Это обновит `env.js` в контейнере.

### Шаг 4: Очистка кеша браузера

В браузере:
1. Откройте DevTools (F12)
2. Перейдите на вкладку Application/Storage
3. Очистите:
   - Local Storage
   - Session Storage
   - Cookies
4. Обновите страницу (Ctrl+Shift+R или Cmd+Shift+R)

### Шаг 5: Проверка консоли браузера

Откройте консоль браузера (F12) и проверьте ошибки:
- CORS ошибки
- Mixed Content ошибки
- Network ошибки

## Диагностика

### Проверка доступности Supabase через HTTPS

```bash
curl -I https://multiminder.duckdns.org/auth/v1/health
```

Должен вернуть HTTP 200 или 404 (но не ошибку подключения).

### Проверка логов Nginx

```bash
sudo tail -f /var/log/nginx/error.log
```

### Проверка логов Docker контейнера

```bash
docker logs inventory-app-frontend --tail 50
```

### Проверка работы Supabase локально

```bash
supabase status
```

Убедитесь, что Supabase работает на `http://127.0.0.1:54321`.

## Частые ошибки

### "Failed to fetch"
- **Причина**: Mixed Content или неправильный URL
- **Решение**: Убедитесь, что все URL используют HTTPS

### "CORS policy"
- **Причина**: Неправильные заголовки в Nginx
- **Решение**: Проверьте `X-Forwarded-Proto` и другие заголовки

### "NetworkError"
- **Причина**: Supabase недоступен
- **Решение**: Проверьте, что Supabase работает: `supabase status`

### Сессия не сохраняется
- **Причина**: Проблемы с куками между HTTP и HTTPS
- **Решение**: Очистите куки и войдите заново

## Если ничего не помогает

1. Временно отключите HTTPS редирект в Nginx
2. Проверьте работу через HTTP
3. Если работает - проблема в HTTPS конфигурации
4. Если не работает - проблема в другом месте

```bash
# Временно отключить HTTPS редирект
sudo nano /etc/nginx/sites-available/inventory-app
# Закомментируйте: return 301 https://$server_name$request_uri;
sudo systemctl reload nginx
```

