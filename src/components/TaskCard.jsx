import React from 'react'
import { Pencil, Trash2 } from 'lucide-react'

export default function TaskCard({ item, onEdit, onDelete }) {
  const badgeClass = {
    'запланировано': 'badge-info',
    'в процессе':    'badge-warning',
    'завершено':     'badge-success'
  }[item.status] || 'badge'

  return (
    <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-base-200 transition">
      <div className="flex-1">
        <p className="break-words">{item.title}</p>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`badge ${badgeClass}`}>{item.status}</span>
        {/* Кнопка редактирования */}
        <button className="btn btn-sm btn-ghost" title="Редактировать" onClick={onEdit}>
          <Pencil size={16} />
        </button>
        {/* Кнопка удаления */}
        <button className="btn btn-sm btn-ghost" title="Удалить" onClick={onDelete}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
