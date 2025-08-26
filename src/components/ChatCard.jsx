import React from 'react'
import PropTypes from 'prop-types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { linkifyText } from '@/utils/linkify.jsx'

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
      <CardHeader className="p-4 pb-2">
        <div className="text-sm text-base-content/70 transition-colors">
          {message.sender}
          {message.created_at && ` • ${formatDate(message.created_at)}`}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
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
      </CardContent>
    </Card>
  )
}