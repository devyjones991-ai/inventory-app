-- Включение Realtime для таблицы chat_messages
-- Это позволяет получать обновления сообщений в реальном времени через Supabase Realtime

-- Добавляем таблицу chat_messages в publication supabase_realtime для realtime обновлений
-- Примечание: В локальной среде Supabase это обычно включается автоматически,
-- но для продакшена требуется явное добавление

-- Удаляем таблицу из publication, если она уже там есть (для idempotency)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.chat_messages;

-- Добавляем таблицу в publication для realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Устанавливаем REPLICA IDENTITY для обеспечения правильной работы realtime
-- Это необходимо для корректной передачи старых значений при UPDATE/DELETE событиях
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

