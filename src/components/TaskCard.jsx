import React from 'react';
import Card from './Card';
import { Pencil, Trash2 } from 'lucide-react';

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

export default function TaskCard({ item, onEdit, onDelete, onView }) {
  const badgeClass = {
    'запланировано': 'badge-info',
    'в процессе':    'badge-warning',
    'завершено':     'badge-success'
  }[item.status] || 'badge';

  const assignee = item.assignee || item.executor;
  const dueDate  = item.due_date || item.planned_date || item.plan_date;

  return (
    <Card
      className="flex justify-between items-center cursor-pointer hover:bg-base-200 transition"
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
          <Pencil className="w-4 h-4" />
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
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
