-- Функция для получения роли пользователя (обходит RLS проблемы)
-- Используется когда прямые запросы к profiles не работают

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Пытаемся получить роль напрямую
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Если роль не найдена, возвращаем null
  RETURN COALESCE(user_role, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Комментарий к функции
COMMENT ON FUNCTION public.get_user_role(UUID) IS 
'Возвращает роль пользователя. Использует SECURITY DEFINER для обхода RLS политик.';

