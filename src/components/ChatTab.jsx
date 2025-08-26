import { memo, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Input } from '@/components/ui'
import { linkifyText } from '@/utils/linkify.jsx'
import AttachmentPreview from './AttachmentPreview.jsx'
import { PaperClipIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import useChat from '../hooks/useChat.js'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

function ChatTab({ selected = null, userEmail }) {
  const objectId = selected?.id || null
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(id)
  }, [searchInput])
  
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
    loadError,
  } = useChat({ objectId, userEmail, search: searchQuery })

  const handleFileChange = useCallback(
    (e) => setFile(e.target.files[0]),
    [setFile],
  )

  const handleMessageChange = useCallback(
    (e) => setNewMessage(e.target.value),
    [setNewMessage],
  )

  const handleSearchChange = useCallback(
    (e) => setSearchInput(e.target.value),
    [],
  )

  const handleSearchToggle = useCallback(() => {
    setIsSearchOpen((prev) => {
      const next = !prev
      if (!next) {
        setSearchInput('')
        setSearchQuery('')
      }
      return next
    })
  }, [])

  if (!objectId) {
    return (
      <div className="p-6 text-sm text-base-content/70 transition-colors">
        Выбери объект
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <button
          type="button"
          className="btn btn-ghost"
          aria-label="Поиск"
          onClick={handleSearchToggle}
        >
          <MagnifyingGlassIcon className="w-6 h-6" />
        </button>
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isSearchOpen ? 'max-h-12 mt-1' : 'max-h-0'
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
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-base-200 rounded-2xl"
      >
        {loadError ? (
          <div className="text-center">
            <p className="mb-2 text-error">Не удалось загрузить сообщения</p>
            <button className="btn btn-sm" onClick={() => loadMore(true)}>
              Повторить
            </button>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center">
                <button className="btn btn-sm" onClick={() => loadMore()}>
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
                  (m.sender || '').trim().toLowerCase() ===
                  (userEmail || '').trim().toLowerCase()
                const dt = new Date(m.created_at)
                const date = dt.toLocaleDateString()
                const time = dt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <div
                    key={m.id}
                    className={`chat ${isOwn ? 'chat-end' : 'chat-start'}`}
                  >
                    {!isOwn && (
                      <div className="chat-header">{m.sender || 'user'}</div>
                    )}
                    <div
                      className={`chat-bubble max-w-[80%] sm:max-w-[60%] whitespace-pre-wrap break-words rounded-2xl shadow-md px-4 py-2 flex flex-col ${
                        isOwn
                          ? 'bg-primary text-primary-content'
                          : 'bg-base-100 text-base-content'
                      }`}
                    >
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
                        {`${date} ${time}`}
                        {m.read_at ? ' ✓' : ''}
                        {m._optimistic ? ' • отправка…' : ''}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>

      <div className="p-3 border-t space-y-2">
        {file && filePreview && <AttachmentPreview url={filePreview} />}
        <div className="flex items-center gap-2">
          <label
            htmlFor="chat-file-input"
            className="btn btn-ghost"
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
            className="btn btn-primary"
            disabled={sending || (!newMessage.trim() && !file)}
            onClick={handleSend}
          >
            {sending ? 'Отправка…' : 'Отправить'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default memo(ChatTab)

ChatTab.propTypes = {
  selected: PropTypes.shape({
    id: PropTypes.number.isRequired,
  }),
  userEmail: PropTypes.string.isRequired,
}