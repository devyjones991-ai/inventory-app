import React from 'react'

export default function InventorySidebar({ objects, selected, onSelect, onCreate }) {
  return (
    <aside className="w-72 p-4 bg-white shadow flex flex-col">
      <h2 className="font-bold mb-4 text-lg">Объекты</h2>
      <div className="flex-1 overflow-auto space-y-2">
        {objects.map(o => (
          <button
            key={o.id}
            onClick={() => onSelect(o)}
            className={`block w-full text-left px-3 py-2 rounded ${
              selected?.id === o.id ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            {o.name}
          </button>
        ))}
      </div>
      <button
        onClick={async () => {
          const name = prompt('Название нового объекта')
          if (name) onCreate(name)
        }}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white rounded py-2"
      >
        ➕ Добавить
      </button>
    </aside>
  )
}
