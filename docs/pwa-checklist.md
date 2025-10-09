# Контрольный список PWA

## Lighthouse PWA Audit

- [x] Добавлен `manifest.webmanifest` с `start_url`, `display=standalone`, цветами темы и SVG-иконками 192/512 px.
- [x] Указан `<link rel="manifest">` и `<meta name="theme-color">` в `index.html`.
- [x] Настроен `vite-plugin-pwa` с автоматическим обновлением сервис-воркера и генерацией `workbox`.
- [x] Включена регистрация сервис-воркера в `src/main.jsx`.

## Оффлайн-кэширование

- [x] Статические ассеты (`js`, `css`, `html`, `png`, `svg`, `json`) кэшируются Workbox-стратегией `NetworkFirst` с таймаутом.
- [x] API Supabase обслуживается через `NetworkFirst` с отдельным кэшем и ограничением по времени жизни.
- [x] SVG-иконки и `env.js` добавлены в `includeAssets` для доступности оффлайн.

## Установка приложения

- [x] Манифест с `short_name` и значками обеспечивает приглашение на установку.
- [x] `display: standalone` и цвета темы обеспечивают нативный вид после установки.
- [x] Автоматическая регистрация сервис-воркера включает событие `beforeinstallprompt` в поддерживаемых браузерах.
