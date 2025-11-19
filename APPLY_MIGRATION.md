# Применение миграции hardware (Windows)

## Проблема
Ошибка: `Could not find the 'cost' column of 'hardware' in the schema cache`

## Решение: Применить миграцию

Миграция уже создана: `supabase/migrations/20250902000009_add-hardware-fields.sql`

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

