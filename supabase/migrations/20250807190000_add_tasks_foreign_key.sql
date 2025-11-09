-- Добавление внешнего ключа для tasks.object_id после создания таблицы objects
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_object_id_fkey 
  FOREIGN KEY (object_id) 
  REFERENCES public.objects(id) 
  ON DELETE CASCADE;

