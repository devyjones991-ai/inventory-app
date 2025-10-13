import {
  PaperClipIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import useChat from "../hooks/useChat.js";

import AttachmentPreview from "./AttachmentPreview.jsx";

import { Button, Input } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/utils/date";
import { linkifyText } from "@/utils/linkify.jsx";
import { getMessageType } from "@/utils/messageUtils.js";
import "../assets/chat-gpt-style.css";

function ChatTab({
  selected = null,
  userEmail,
  active = false,
  onCountChange,
}) {
  const objectId = selected?.id || null;
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const {
    messages,
    hasMore,
    loadMore,
    newMessage,
    setNewMessage,
    sending,
    file,
    setFile,
    filePreview,
    handleSend,
    handleKeyDown,
    fileInputRef,
    scrollRef,
    markMessagesAsRead,
    loadError,
  } = useChat({ objectId, userEmail, search: searchQuery });

  // Pin-to-bottom logic (like messengers)
  const pinnedRef = useRef(true);
  const scrollRafRef = useRef(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const bottomRef = useRef(null);
  const scrollToBottom = useCallback((smooth = true) => {
    const el = bottomRef.current;
    if (el)
      el.scrollIntoView({ block: "end", behavior: smooth ? "smooth" : "auto" });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef?.current;
    if (!el) return;
    if (scrollRafRef.current) return;
    scrollRafRef.current = true;
    requestAnimationFrame(() => {
      const threshold = 80; // px
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      if (pinnedRef.current !== nearBottom) pinnedRef.current = nearBottom;
      setShowScrollDown((prev) => (prev === !nearBottom ? prev : !nearBottom));
      scrollRafRef.current = false;
    });
  }, [scrollRef]);

  // Ensure we always scroll to the latest message when the tab becomes active
  useLayoutEffect(() => {
    if (!active) return;
    pinnedRef.current = true;
    const raf = requestAnimationFrame(() => scrollToBottom());
    return () => cancelAnimationFrame(raf);
  }, [active, scrollToBottom]);

  // Also keep pinned to bottom on new messages
  useLayoutEffect(() => {
    if (!active) return;
    if (!pinnedRef.current) return;
    const raf = requestAnimationFrame(() => scrollToBottom());
    return () => cancelAnimationFrame(raf);
  }, [active, messages.length, scrollToBottom]);

  useEffect(() => {
    const me = (userEmail || "").trim().toLowerCase();
    const unread = messages.reduce((acc, m) => {
      const sender = (m.sender || "").trim().toLowerCase();
      const isOwn = sender === me;
      return acc + (!m.read_at && !isOwn ? 1 : 0);
    }, 0);
    onCountChange?.(unread);
  }, [messages, userEmail, onCountChange]);

  useEffect(() => {
    if (active) {
      markMessagesAsRead();
    }
  }, [active, markMessagesAsRead]);

  const handleFileChange = useCallback(
    (e) => setFile(e.target.files[0]),
    [setFile],
  );

  const handleMessageChange = useCallback(
    (e) => setNewMessage(e.target.value),
    [setNewMessage],
  );

  const handleSearchChange = useCallback(
    (e) => setSearchInput(e.target.value),
    [],
  );

  const handleSearchToggle = useCallback(() => {
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (!next) {
        setSearchInput("");
        setSearchQuery("");
      }
      return next;
    });
  }, []);

  if (!objectId) {
    return <div className="p-6 text-sm text-foreground/70">Выбери объект</div>;
  }

  return (
    <div className="chat-container">
      {/* Навигационная панель */}
      <div className="chat-nav-bar">
        <a href="#" className="text-sm font-medium">
          Multiminder Chat
        </a>
        <div className="chat-close" onClick={handleSearchToggle}>
          <div className="chat-line one"></div>
          <div className="chat-line two"></div>
        </div>
      </div>

      {/* Поиск */}
      {isSearchOpen && (
        <div className="chat-search">
          <input
            type="text"
            className="chat-search-input"
            placeholder="Поиск сообщений..."
            value={searchInput}
            onChange={handleSearchChange}
            autoFocus
          />
          <MagnifyingGlassIcon className="chat-search-icon" />
        </div>
      )}
      {/* Область сообщений */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-messages-area"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "600px",
          overscrollBehavior: "contain",
        }}
      >
        {loadError ? (
          <div className="text-center">
            <p className="mb-2 text-destructive">
              Не удалось загрузить сообщения
            </p>
            <button
              className="px-3 py-1.5 text-sm rounded border"
              onClick={() => loadMore(true)}
            >
              Повторить
            </button>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center">
                <button
                  className="chat-message system"
                  onClick={() => loadMore()}
                >
                  Загрузить ещё
                </button>
              </div>
            )}
            {messages.length === 0 ? (
              searchQuery ? (
                <div className="chat-message system">Сообщения не найдены</div>
              ) : (
                <div className="chat-message system">
                  Сообщений пока нет — напиши первым.
                </div>
              )
            ) : (
              messages.map((m) => {
                const isOwn =
                  (m.sender || "").trim().toLowerCase() ===
                  (userEmail || "").trim().toLowerCase();
                const when = formatDateTime(m.created_at);
                const key =
                  m.id ||
                  m.client_generated_id ||
                  `${m.created_at}-${m.sender}`;

                // Определяем тип сообщения для авторасширения
                const messageType = getMessageType(m.content);

                return (
                  <div
                    key={key}
                    data-testid="chat-message"
                    className={`chat-message ${isOwn ? "user" : "assistant"} ${messageType}`}
                  >
                    {/* Отправитель (только для сообщений не от текущего пользователя) */}
                    {!isOwn && (
                      <div className="chat-message-sender">
                        {m.sender || "user"}
                      </div>
                    )}

                    {/* Пузырь сообщения */}
                    <div className="chat-message-bubble">
                      {/* Контент сообщения */}
                      {m.content && (
                        <div className="chat-message-content">
                          {linkifyText(m.content)}
                        </div>
                      )}

                      {/* Файл */}
                      {m.file_url && (
                        <div className="mt-2">
                          <AttachmentPreview url={m.file_url} />
                        </div>
                      )}
                    </div>

                    {/* Время отправки */}
                    <div className="chat-message-time">
                      {when}
                      {m.read_at ? " ✓" : ""}
                      {m._optimistic ? " • отправка…" : ""}
                    </div>
                  </div>
                );
              })
            )}
            {/* Индикатор загрузки */}
            {sending && (
              <div className="chat-loading">
                <span>Отправка</span>
                <div className="chat-loading-dots">
                  <div className="chat-loading-dot"></div>
                  <div className="chat-loading-dot"></div>
                  <div className="chat-loading-dot"></div>
                </div>
              </div>
            )}
            {/* bottom sentinel to allow precise scrollToBottom */}
            <div ref={bottomRef} />
          </>
        )}
        {showScrollDown && (
          <button
            type="button"
            aria-label="Scroll to latest"
            className="absolute right-3 bottom-3 rounded-full p-2 bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => {
              pinnedRef.current = true;
              scrollToBottom(true);
            }}
          >
            <ChevronDownIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Область ввода */}
      <div className="chat-sender-area">
        {file && filePreview && <AttachmentPreview url={filePreview} />}

        <div className="chat-input-place">
          <label
            htmlFor="chat-file-input"
            className="chat-attachment"
            data-testid="file-label"
            aria-label="Прикрепить файл"
            title="Прикрепить файл"
            role="button"
            tabIndex={0}
          >
            <PaperClipIcon className="chat-attachment-icon" />
          </label>
          <input
            id="chat-file-input"
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <input
            className="chat-send-input"
            placeholder="Напиши сообщение…"
            value={newMessage}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
          />
          <button
            className="chat-send"
            disabled={sending || (!newMessage.trim() && !file)}
            onClick={handleSend}
          >
            <svg className="chat-send-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 11L12 6L17 11M12 18V7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ChatTab);

ChatTab.propTypes = {
  selected: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }),
  userEmail: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onCountChange: PropTypes.func,
};
