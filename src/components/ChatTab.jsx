import {
  PaperClipIcon,
  MagnifyingGlassIcon,
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
  const bottomRef = useRef(null);
  const scrollToBottom = useCallback(() => {
    const el = bottomRef.current;
    if (el) el.scrollIntoView({ block: "end" });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef?.current;
    if (!el) return;
    const threshold = 80; // px
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    pinnedRef.current = nearBottom;
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
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <button
          type="button"
          className="p-2 rounded hover:bg-accent"
          aria-label="Поиск"
          onClick={handleSearchToggle}
        >
          <MagnifyingGlassIcon className="w-6 h-6" />
        </button>
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isSearchOpen ? "max-h-12 mt-1" : "max-h-0"
          }`}
        >
          {isSearchOpen && (
            <Input
              type="text"
              className="w-full h-8 text-sm"
              placeholder="Поиск сообщений"
              value={searchInput}
              onChange={handleSearchChange}
              autoFocus
            />
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 bg-muted rounded-2xl"
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
                  className="px-3 py-1.5 text-sm rounded border"
                  onClick={() => loadMore()}
                >
                  Загрузить ещё
                </button>
              </div>
            )}
            {messages.length === 0 ? (
              searchQuery ? (
                <div className="text-sm text-gray-400">
                  Сообщения не найдены
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  Сообщений пока нет — напиши первым.
                </div>
              )
            ) : (
              messages.map((m) => {
                const isOwn =
                  (m.sender || "").trim().toLowerCase() ===
                  (userEmail || "").trim().toLowerCase();
                const when = formatDateTime(m.created_at);
                return (
                  <div
                    key={m.id}
                    data-testid="chat-message"
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[60%] whitespace-pre-wrap break-words rounded-2xl shadow-md px-4 py-2 flex flex-col ${
                        isOwn
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                      }`}
                    >
                      {!isOwn && (
                        <span className="mb-1 font-semibold">
                          {m.sender || "user"}
                        </span>
                      )}
                      {m.content && (
                        <span className="whitespace-pre-wrap break-words">
                          {linkifyText(m.content)}
                        </span>
                      )}
                      {m.file_url && (
                        <div className="mt-2">
                          <AttachmentPreview url={m.file_url} />
                        </div>
                      )}
                      <span className="self-end mt-1 text-xs opacity-60">
                        {when}
                        {m.read_at ? " ✓" : ""}
                        {m._optimistic ? " • отправка…" : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {/* bottom sentinel to allow precise scrollToBottom */}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <div className="p-2 sm:p-3 border-t space-y-2">
        {file && filePreview && <AttachmentPreview url={filePreview} />}
        <div className="flex items-center gap-2">
          <label
            htmlFor="chat-file-input"
            className="p-2 rounded hover:bg-accent cursor-pointer"
            data-testid="file-label"
            aria-label="Прикрепить файл"
            title="Прикрепить файл"
            role="button"
            tabIndex={0}
          >
            <PaperClipIcon className="w-6 h-6" />
          </label>
          <input
            id="chat-file-input"
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Textarea
            className="w-full min-h-24"
            placeholder="Напиши сообщение… (Enter — отправить, Shift+Enter — новая строка)"
            value={newMessage}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex justify-end">
          <Button
            disabled={sending || (!newMessage.trim() && !file)}
            onClick={handleSend}
          >
            {sending ? "Отправка…" : "Отправить"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(ChatTab);

ChatTab.propTypes = {
  selected: PropTypes.shape({
    id: PropTypes.number.isRequired,
  }),
  userEmail: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onCountChange: PropTypes.func,
};
