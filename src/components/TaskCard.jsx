import { memo, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
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

function TaskCard({ item, onEdit, onDelete, onView }) {
  const badgeClass = useMemo(
    () =>
      ({
        запланировано: 'badge-info',
        'в процессе': 'badge-warning',
        завершено: 'badge-success',
      })[item.status] || 'badge',
    [item.status],
  )

  const assignee = useMemo(
    () => item.assignee || item.executor,
    [item.assignee, item.executor],
  )

  const dueDate = useMemo(
    () => item.due_date || item.planned_date || item.plan_date,
    [item.due_date, item.planned_date, item.plan_date],
  )

  const handleEdit = useCallback(
    (e) => {
      e.stopPropagation()
      onEdit()
    },
    [onEdit],
  )

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation()
      onDelete()
    },
    [onDelete],
  )

  const canManage = true

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
      <div className="flex flex-col xs:flex-row md:flex-row flex-wrap items-center gap-2 mt-2 xs:mt-0">
        <span className={`badge ${badgeClass}`}>{item.status}</span>
        {canManage && (
          <>
            <button
              className="btn btn-sm btn-ghost w-full xs:w-auto"
              title="Редактировать"
              onClick={handleEdit}
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              className="btn btn-sm btn-ghost w-full xs:w-auto"
              title="Удалить"
              onClick={handleDelete}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </Card>
  )
}

export default memo(TaskCard)

TaskCard.propTypes = {
  item: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
}
