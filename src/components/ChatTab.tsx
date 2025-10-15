import {
  PaperClipIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  memo,
  useCallback,
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

  const { messages, loading, error, sendMessage, searchMessages, clearSearch } =
    useChat({
      objectId: selected?.id || "",
      userEmail: userEmail || "",
      search: searchQuery,
    });

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useLayoutEffect(() => {
    if (active) {
      scrollToBottom();
    }
  }, [messages, active, scrollToBottom]);

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

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Выберите объект для просмотра чата
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

          <div className="chat-input-area">
            <div className="chat-input-container">
              <div className="chat-textarea-wrapper">
                <textarea
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
