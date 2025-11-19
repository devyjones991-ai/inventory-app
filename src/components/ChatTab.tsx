import {
  PaperClipIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import useChat from "../hooks/useChat";
import { Object } from "../types";
import { formatDateTime } from "../utils/date";
import { linkifyText } from "../utils/linkify";
import "../assets/space-theme.css";

import AttachmentPreview from "./AttachmentPreview";
import { Button, Input } from "./ui";
import { Textarea } from "./ui/textarea";
import "../assets/chat-gpt-style.css";

interface ChatTabProps {
  selected?: Object | null;
  userEmail?: string;
  active?: boolean;
}

function ChatTab({ selected = null, userEmail, active = false }: ChatTabProps) {
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (
      messagesEndRef.current &&
      typeof messagesEndRef.current.scrollIntoView === "function"
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const { messages, loading, error, sendMessage, searchMessages, clearSearch } =
    useChat({
      objectId: selected?.id || "",
      userEmail: userEmail || "",
      search: searchQuery,
    });

  // Автофокус на поле ввода при активации вкладки
  useEffect(() => {
    if (active && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [active]);

  // Автоскролл при получении новых сообщений (включая realtime)
  useLayoutEffect(() => {
    if (active && messages.length > 0 && !isCollapsed) {
      // Небольшая задержка для рендера DOM
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, active, isCollapsed, scrollToBottom]);

  // Дополнительный автоскролл при активной вкладке (для realtime сообщений)
  useEffect(() => {
    if (active && !isCollapsed && messages.length > 0) {
      // Задержка для реального времени обновлений
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [messages.length, active, isCollapsed]);

  // Автоскролл к окну ввода при открытии чата
  useLayoutEffect(() => {
    if (!isCollapsed) {
      // Небольшая задержка для рендера
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isCollapsed, scrollToBottom]);

  // Автоскролл при переключении на вкладку чата
  useLayoutEffect(() => {
    if (active && !isCollapsed) {
      // Небольшая задержка для рендера
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  }, [active, isCollapsed, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selected?.id) return;

    try {
      await sendMessage(message.trim());
      setMessage("");
      // Автоскролл произойдет автоматически через useLayoutEffect при изменении messages
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [message, selected?.id, sendMessage]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selected?.id) return;

      try {
        await sendMessage("", file);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    },
    [selected?.id, sendMessage],
  );

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !selected?.id) return;

      try {
        await searchMessages(query.trim());
      } catch (error) {
        console.error("Error searching messages:", error);
      }
    },
    [selected?.id, searchMessages],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    clearSearch();
  }, [clearSearch]);

  // Если нет выбранного объекта, показываем сообщение
  if (!selected) {
    return (
      <div className="space-card flex items-center justify-center h-64 text-space-text-muted">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p>Выберите объект для просмотра чата</p>
        </div>
      </div>
    );
  }

  // Обработка ошибок
  if (error) {
    return (
      <div className="space-card flex items-center justify-center h-64 text-space-text-muted">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-red-500 mb-2">
            Произошла ошибка при загрузке чата
          </p>
          <p className="text-sm">{error}</p>
          {error.includes("No objectId") && (
            <p className="text-xs text-yellow-500 mt-2">
              Выберите объект для просмотра чата
            </p>
          )}
          {error.includes("Supabase") && (
            <p className="text-xs text-yellow-500 mt-2">
              Проверьте настройки Supabase в public/env.js
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 space-bg-gradient rounded-xl">
      {/* Заголовок чата - фиксированный */}
      <div className="flex-shrink-0 space-card p-4 border-b border-space-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="space-title text-xl">💬 Чат</h3>
            <p className="text-space-text-muted">
              Обсуждение по объекту "{selected.name}"
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="space-button p-2"
              onClick={() => setShowSearch(!showSearch)}
              aria-label="Найти"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>
            <button
              className="space-button p-2"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Развернуть чат" : "Свернуть чат"}
            >
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="mt-4">
            <div className="flex gap-3">
              <input
                className="space-input flex-1"
                placeholder="🔍 Поиск сообщений..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchQuery);
                  }
                }}
              />
              <button
                className="space-button"
                onClick={() => handleSearch(searchQuery)}
              >
                🔍 Найти
              </button>
              <button className="space-button" onClick={handleClearSearch}>
                ❌ Очистить
              </button>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Контейнер сообщений - ГЛАВНОЕ! */}
          <div className="flex-1 overflow-y-auto min-h-0 space-list">
            {loading && (
              <div className="space-card p-4 text-center text-space-text-muted">
                <div className="text-2xl mb-2">⏳</div>
                Загрузка сообщений...
              </div>
            )}

            {error && (
              <div className="space-card p-4 text-center text-red-500">
                <div className="text-2xl mb-2">⚠️</div>
                Ошибка загрузки сообщений: {error}
              </div>
            )}

            {/* Кнопка загрузки старых сообщений */}

            {messages.map((msg, index) => {
              const isCurrentUser = msg.sender === userEmail;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isNewSender = !prevMsg || prevMsg.sender !== msg.sender;

              return (
                <div
                  key={msg.id}
                  className={`chat-message ${isCurrentUser ? "user" : "assistant"}`}
                >
                  {isNewSender && (
                    <div className="chat-message-sender-header">
                      <span className="chat-sender-name">
                        {isCurrentUser ? "Вы" : msg.sender}
                      </span>
                    </div>
                  )}
                  <div className="chat-message-bubble">
                    <div className="chat-message-content">
                      {msg.file_url ? (
                        <div>
                          <p className="link-container">
                            {linkifyText(msg.content, 50, "CHAT")}
                          </p>
                          <AttachmentPreview url={msg.file_url} />
                        </div>
                      ) : (
                        <p className="link-container">
                          {linkifyText(msg.content, 50, "CHAT")}
                        </p>
                      )}
                    </div>
                    <div className="chat-message-time">
                      {formatDateTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода - фиксированное внизу */}
          <div className="flex-shrink-0 space-card p-4 border-t border-space-border">
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  className="space-input w-full resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="💬 Введите сообщение..."
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className="space-button p-2"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Прикрепить файл"
                >
                  📎
                </button>
                <button
                  className="space-button space-active p-2"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  📤
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              aria-label="Выберите файл для загрузки"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default memo(ChatTab);
