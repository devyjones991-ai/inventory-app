// src/components/TaskCard.jsx
import React from 'react';

const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182l-10.5 10.5a1.5 1.5 0 0 1-.684.387l-4.5 1.125a.75.75 0 0 1-.91-.91l1.125-4.5a1.5 1.5 0 0 1 .387-.684l10.5-10.5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 7.125L16.875 4.5"
    />
  </svg>
)

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788-9L9.26 18M6 6h12M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
    />
  </svg>
)

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
        <button className="btn btn-sm btn-ghost" title="Редактировать" onClick={onEdit}>
          <PencilIcon />
        </button>
        <button className="btn btn-sm btn-ghost" title="Удалить" onClick={onDelete}>
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}
