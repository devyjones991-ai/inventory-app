-- Fix task status constraint to match frontend statuses
-- Frontend uses: pending, in_progress, completed, cancelled
-- Update constraint to allow these statuses

alter table tasks drop constraint if exists tasks_status_check;

alter table tasks
  add constraint tasks_status_check
  check (status in ('pending', 'in_progress', 'completed', 'cancelled', 'planned', 'done', 'canceled'));

-- Update any existing 'planned' tasks to 'pending'
update tasks set status = 'pending' where status = 'planned';

-- Update any existing 'done' tasks to 'completed'
update tasks set status = 'completed' where status = 'done';

-- Update any existing 'canceled' tasks to 'cancelled'
update tasks set status = 'cancelled' where status = 'canceled';

