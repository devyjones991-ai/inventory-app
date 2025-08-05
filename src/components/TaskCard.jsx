import React from 'react';

/**
 * Format date string into locale friendly format.
 * Falls back to original value on parse errors.
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  } catch {
    return dateStr;
  }
}

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
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5" />
  </svg>
);

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
);

export default function TaskCard({ item, onEdit, onDelete, onView }) {
  const badgeClass = {
    'запланировано': 'badge-info',
    'в процессе':    'badge-warning',
    'завершено':     'badge-success'
  }[item.status] || 'badge';

  const assignee = item.assignee || item.executor;
  const dueDate  = item.due_date || item.planned_date || item.plan_date;

  return (
    <div
      className="flex justify-between items-center p-3 border rounded-lg hover:bg-base-200 transition cursor-pointer"
      onClick={onView}
    >
      <div className="flex-1">
        <p className="break-words whitespace-pre-wrap">{item.title}</p>
        {(assignee || dueDate) && (
          <p className="text-sm text-gray-500">
            {assignee && <span>👤 {assignee}</span>}
            {assignee && dueDate && ' • '}
            {dueDate && <span>📅 {formatDate(dueDate)}</span>}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <span className={`badge ${badgeClass}`}>{item.status}</span>
        <button
          className="btn btn-sm btn-ghost"
          title="Редактировать"
          onClick={e => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <PencilIcon />
        </button>
        <button
          className="btn btn-sm btn-ghost"
          title="Удалить"
          onClick={e => {
            e.stopPropagation();
            if (window.confirm('Удалить задачу?')) {
              onDelete();
            }
          }}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
