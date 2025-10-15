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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Чат</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>

      {showSearch && (
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="Поиск сообщений..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchQuery);
                }
              }}
            />
            <Button onClick={() => handleSearch(searchQuery)}>Найти</Button>
            <Button variant="outline" onClick={handleClearSearch}>
              Очистить
            </Button>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && (
              <div className="text-center text-muted-foreground">
                Загрузка сообщений...
              </div>
            )}

            {error && (
              <div className="text-center text-destructive">
                Ошибка загрузки сообщений: {error}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === userEmail ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender === userEmail
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{msg.sender}</div>
                  <div className="text-sm">
                    {msg.file_url ? (
                      <div>
                        <p>{linkifyText(msg.content)}</p>
                        <AttachmentPreview url={msg.file_url} />
                      </div>
                    ) : (
                      <p>{linkifyText(msg.content)}</p>
                    )}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatDateTime(msg.created_at)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите сообщение..."
                  className="min-h-[60px] max-h-[120px] resize-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperClipIcon className="w-4 h-4" />
                </Button>
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  Отправить
                </Button>
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
