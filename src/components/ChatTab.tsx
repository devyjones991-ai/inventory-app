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
    if (messagesEndRef.current) {
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

  useLayoutEffect(() => {
    if (active) {
      scrollToBottom();
    }
  }, [messages, active, scrollToBottom]);

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
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Выберите объект для просмотра чата</p>
      </div>
    );
  }


  // Обработка ошибок
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Произошла ошибка при загрузке чата</p>
          <p className="text-sm text-muted-foreground">{error}</p>
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
    <div className="chat-container">
      <div className="chat-nav-bar">
        <h3 className="text-lg font-semibold text-white">Чат</h3>
        <div className="flex items-center gap-2">
          <button
            className="chat-close"
            onClick={() => setShowSearch(!showSearch)}
          >
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
          </button>
          <button
            className="chat-close"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronDownIcon
              className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="chat-search-bar">
          <div className="flex gap-2">
            <input
              className="chat-search-input"
              placeholder="Поиск сообщений..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchQuery);
                }
              }}
            />
            <button className="chat-search-button" onClick={() => handleSearch(searchQuery)}>
              Найти
            </button>
            <button className="chat-clear-button" onClick={handleClearSearch}>
              Очистить
            </button>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <>
          <div className="chat-messages-area">
            <div className="chat-messages-container">
              {loading && (
                <div className="chat-loading">
                  Загрузка сообщений...
                </div>
              )}

              {error && (
                <div className="chat-error">
                  Ошибка загрузки сообщений: {error}
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.sender === userEmail ? "user" : "assistant"}`}
                >
                  <div className="chat-message-bubble">
                    <div className="chat-message-sender">{msg.sender}</div>
                    <div className="chat-message-content">
                      {msg.file_url ? (
                        <div>
                          <p>{linkifyText(msg.content)}</p>
                          <AttachmentPreview url={msg.file_url} />
                        </div>
                      ) : (
                        <p>{linkifyText(msg.content)}</p>
                      )}
                    </div>
                    <div className="chat-message-time">
                      {formatDateTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="chat-input-area">
            <div className="chat-input-container">
              <div className="chat-textarea-wrapper">
                <textarea
                  ref={textareaRef}
                  className="chat-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите сообщение..."
                />
              </div>
              <div className="chat-buttons">
                <button
                  className="chat-attach-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperClipIcon className="w-4 h-4" />
                </button>
                <button 
                  className="chat-send-button" 
                  onClick={handleSendMessage} 
                  disabled={!message.trim()}
                >
                  Отправить
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default memo(ChatTab);
