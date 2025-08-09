import React from 'react'
import Card from './Card'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function InventorySidebar({
  objects,
  selected,
  onSelect,
  onEdit,
  onDelete,
  notifications = {},
  isAdmin = false,
}) {
  return (
    <nav className="flex flex-col space-y-2">
      {objects.map((o) => (
        <Card key={o.id} className="flex items-center justify-between p-2">
          <div className="flex items-center flex-1">
            <button
              onClick={() => onSelect(o)}
              className={`flex-1 text-left px-3 py-2 rounded hover:bg-primary/10 ${
                selected?.id === o.id
                  ? 'border-b-2 border-primary font-medium'
                  : ''
              }`}
            >
              {o.name}
            </button>
            {notifications[o.id] ? (
              <span className="badge badge-error ml-2">
                {notifications[o.id]}
              </span>
            ) : null}
          </div>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(o)}
                className="ml-2 text-primary hover:text-primary/70"
                title="Редактировать объект"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(o.id)}
                className="ml-2 text-red-500 hover:text-red-700"
                title="Удалить объект"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </Card>
      ))}
    </nav>
  )
}
