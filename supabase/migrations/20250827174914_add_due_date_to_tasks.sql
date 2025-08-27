ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS due_date date;

UPDATE tasks
SET due_date = NOW()::date
WHERE due_date IS NULL;
