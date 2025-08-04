import React from 'react';

export default function InventorySidebar({
  objects,
  selected,
  onSelect,
  onEdit,
  onDelete
}) {
  return (
    <nav className="flex flex-col space-y-2">
      {objects.map(o => (
        <div
          key={o.id}
          className="flex items-center justify-between"
        >
          <button
            onClick={() => onSelect(o)}
            className={`flex-1 text-left px-3 py-2 rounded ${
              selected?.id === o.id
                ? 'bg-blue-100 font-medium'
                : 'hover:bg-gray-100'
            }`}
          >
            {o.name}
          </button>
          <button
            onClick={() => onEdit(o)}
            className="ml-2 text-blue-500 hover:text-blue-700"
            title="Редактировать объект"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(o.id)}
            className="ml-2 text-red-500 hover:text-red-700"
            title="Удалить объект"
          >
            ×
          </button>
        </div>
      ))}
    </nav>
);
}
