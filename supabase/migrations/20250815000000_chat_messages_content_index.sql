-- Создание расширения pg_trgm для полнотекстового поиска с триграммами
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Создание индекса для полнотекстового поиска по содержимому сообщений
CREATE INDEX IF NOT EXISTS chat_messages_content_idx ON chat_messages USING gin (content gin_trgm_ops);
