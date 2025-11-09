# Быстрая настройка Production

## Автоматический запуск при перезагрузке сервера

### Шаг 1: Запустите скрипт настройки

```bash
cd ~/inventory-app
bash setup-production-autostart.sh
```

Скрипт автоматически:
- ✅ Настроит автозапуск Docker
- ✅ Настроит автозапуск Supabase
- ✅ Настроит автозапуск приложения
- ✅ Настроит nginx для проксирования на `multiminder.duckdns.org`
- ✅ Запустит все сервисы

### Что будет работать:

1. **Supabase** запускается автоматически при загрузке сервера
2. **Приложение** (Docker контейнер) запускается автоматически
3. **Nginx** проксирует запросы:
   - `https://multiminder.duckdns.org/` → приложение (порт 3000)
   - `https://multiminder.duckdns.org/rest/v1/` → Supabase API (порт 54321)
   - `https://multiminder.duckdns.org/auth/v1/` → Supabase Auth

### Проверка после настройки:

```bash
# Проверить статус всех сервисов
sudo systemctl status supabase.service
sudo systemctl status inventory-app-production.service
sudo systemctl status nginx

# Проверить доступность
curl https://multiminder.duckdns.org
```

### Управление сервисами:

```bash
# Перезапуск всех сервисов
sudo systemctl restart supabase.service
sudo systemctl restart inventory-app-production.service
sudo systemctl restart nginx

# Просмотр логов
sudo journalctl -u supabase.service -f
sudo journalctl -u inventory-app-production.service -f
```

### После перезагрузки сервера:

Все сервисы запустятся автоматически! Проверьте:

```bash
# После перезагрузки выполните:
sudo systemctl status supabase.service
sudo systemctl status inventory-app-production.service
curl https://multiminder.duckdns.org
```

Подробная документация: [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)

