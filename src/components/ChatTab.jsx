import React from 'react'
import { linkifyText } from '../utils/linkify.jsx'
import AttachmentPreview from './AttachmentPreview.jsx'
import { PaperClipIcon } from '@heroicons/react/24/outline'
import useChat from '../hooks/useChat.js'

export default function ChatTab({ selected, userEmail }) {
  const objectId = selected?.id || null
  const {
    messages,
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
  } = useChat({ objectId, userEmail })

  if (!objectId) {
    return (
      <div className="p-6 text-sm text-base-content/70 transition-colors">
        Выбери объект
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-base-200 rounded-2xl"
      >
        {messages.length === 0 ? (
          <div className="text-sm text-gray-400">
            Сообщений пока нет — напиши первым.
          </div>
        ) : (
          messages.map((m) => {
            const isOwn = m.sender === userEmail
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
                  className={`chat-bubble whitespace-pre-wrap break-words rounded-2xl shadow-md px-4 py-2 flex flex-col ${
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
            onChange={(e) => setFile(e.target.files[0])}
          />
          <textarea
            className="textarea textarea-bordered w-full min-h-24"
            placeholder="Напиши сообщение… (Enter — отправить, Shift+Enter — новая строка)"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            disabled={sending || (!newMessage.trim() && !file)}
            onClick={handleSend}
          >
            {sending ? 'Отправка…' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  )
}
