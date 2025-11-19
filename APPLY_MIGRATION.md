# Применение миграции hardware

## Проблема
Ошибка: `Could not find the 'cost' column of 'hardware' in the schema cache`

## Решение: Применить миграцию

Миграция уже создана: `supabase/migrations/20250902000009_add-hardware-fields.sql`

---

## Для Ubuntu сервера (без GUI) - РЕКОМЕНДУЕТСЯ

### Способ 1: Автоматический скрипт

```bash
cd /path/to/inventory-app
chmod +x apply-hardware-migration.sh
./apply-hardware-migration.sh
```

Скрипт автоматически:
- ✅ Проверит статус Supabase
- ✅ Применит миграцию через Supabase CLI или psql
- ✅ Проверит успешность применения

### Способ 2: Через Supabase CLI

```bash
# Убедитесь, что Supabase запущен
supabase status

# Примените новую миграцию (сохранит данные)
supabase db push

# Или сбросьте БД и примените все миграции (удалит данные!)
supabase db reset
```

### Способ 3: Через psql напрямую

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/migrations/20250902000009_add-hardware-fields.sql
```

---

## Для Windows (с GUI)

## Способ 1: Через Supabase Studio (РЕКОМЕНДУЕТСЯ)

1. Откройте Supabase Studio в браузере:
   ```
   http://localhost:54323
   ```

2. Перейдите в раздел **SQL Editor** (в левом меню)

3. Откройте файл миграции:
   ```
   supabase/migrations/20250902000009_add-hardware-fields.sql
   ```

4. Скопируйте весь SQL код из файла

5. Вставьте в SQL Editor и нажмите **Run** (или F5)

## Способ 2: Через psql (если установлен PostgreSQL)

```powershell
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/migrations/20250902000009_add-hardware-fields.sql
```

## Способ 3: Через Docker (если Supabase в Docker)

```powershell
docker exec -i <supabase-db-container> psql -U postgres -d postgres < supabase/migrations/20250902000009_add-hardware-fields.sql
```

## Проверка

После применения миграции проверьте, что колонки добавлены:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hardware' 
ORDER BY ordinal_position;
```

Должны быть видны колонки: `type`, `model`, `cost`, `vendor`, `notes`, и т.д.

## После применения

Перезапустите приложение или обновите страницу в браузере (Ctrl+F5).

