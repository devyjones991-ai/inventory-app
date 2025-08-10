import React from 'react'
import Card from './Card'
import { linkifyText } from '../utils/linkify.jsx'

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString('ru-RU')
  } catch {
    return dateStr
  }
}

export default function ChatCard({ message }) {
  return (
    <Card className="animate-fade-in">
      <div className="text-sm text-base-content/70 mb-1 transition-colors">
        {message.sender}
        {message.created_at && ` • ${formatDate(message.created_at)}`}
      </div>
      {message.content && (
        <p className="whitespace-pre-wrap break-words">
          {linkifyText(message.content)}
        </p>
      )}
      {message.file_url && (
        <a
          href={message.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline break-all"
        >
          Вложение
        </a>
      )}
    </Card>
  )
}
