-- Автоматическое добавление создателя объекта в object_members
-- Это позволяет создателю видеть и управлять созданным объектом

-- Функция для автоматического добавления создателя в object_members
CREATE OR REPLACE FUNCTION public.handle_new_object()
RETURNS TRIGGER AS $$
BEGIN
  -- Автоматически добавляем создателя объекта в object_members
  INSERT INTO public.object_members (object_id, user_id)
  VALUES (NEW.id, auth.uid())
  ON CONFLICT (object_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического добавления создателя
DROP TRIGGER IF EXISTS on_object_created ON public.objects;
CREATE TRIGGER on_object_created
  AFTER INSERT ON public.objects
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_object();

