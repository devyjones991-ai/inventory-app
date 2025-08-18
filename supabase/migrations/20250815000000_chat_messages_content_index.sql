create index chat_messages_content_idx on chat_messages using gin (content gin_trgm_ops);
