-- Функция для получения всех профилей (для superuser и admin)
-- Обходит проблемы с RLS политиками

CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  permissions JSONB,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Проверяем, что текущий пользователь - superuser или admin
  IF NOT (public.is_superuser() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )) THEN
    RAISE EXCEPTION 'Только superuser или admin может просматривать все профили';
  END IF;

  -- Возвращаем все профили
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.permissions,
    p.created_at,
    p.last_sign_in_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарий к функции
COMMENT ON FUNCTION public.get_all_profiles() IS 
'Возвращает все профили пользователей. Доступна только для superuser и admin. Использует SECURITY DEFINER для обхода RLS.';

