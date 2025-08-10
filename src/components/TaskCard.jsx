import React from 'react'
import Card from './Card'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

/**
 * Format date string into locale friendly format.
 * Falls back to original value on parse errors.
 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU')
  } catch {
    return dateStr
  }
}

export default function TaskCard({
  item,
  onEdit,
  onDelete,
  onView,
  user = {},
}) {
  const badgeClass =
    {
      запланировано: 'badge-info',
      'в процессе': 'badge-warning',
      завершено: 'badge-success',
    }[item.status] || 'badge'

  const assignee = item.assignee || item.executor
  const dueDate = item.due_date || item.planned_date || item.plan_date

  const canManage =
    item.assignee_id === user?.id ||
    item.assignee === user?.user_metadata?.username

  return (
    <Card
      className="flex flex-col xs:flex-row md:flex-row justify-between items-start xs:items-center cursor-pointer hover:bg-base-200 transition-colors animate-fade-in"
      onClick={onView}
    >
      <div className="flex-1">
        <p className="break-words whitespace-pre-wrap">{item.title}</p>
        {(assignee || dueDate) && (
          <p className="text-sm text-base-content/70 transition-colors">
            {assignee && <span>👤 {assignee}</span>}
            {assignee && dueDate && ' • '}
            {dueDate && <span>📅 {formatDate(dueDate)}</span>}
          </p>
        )}
      </div>
      <div className="flex flex-col xs:flex-row md:flex-row items-center gap-2 mt-2 xs:mt-0">
        <span className={`badge ${badgeClass}`}>{item.status}</span>
        {canManage && (
          <>
            <button
              className="btn btn-sm btn-ghost xs:w-full"
              title="Редактировать"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              className="btn btn-sm btn-ghost xs:w-full"
              title="Удалить"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </Card>
  )
}
