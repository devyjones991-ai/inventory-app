import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ThemeSwitcher from './components/ThemeSwitcher'
import InventorySidebar from './components/InventorySidebar'
import InventoryTabs from './components/InventoryTabs'

export default function App() {
  const [objects, setObjects] = useState([])
  const [selected, setSelected] = useState(null)

  // Загрузка списка объектов
  useEffect(() => {
    supabase
      .from('objects')
      .select()
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setObjects(data || [])
      })
  }, [])

  // Создание нового объекта
  const handleCreateObject = async () => {
    const name = prompt('Название нового объекта')
    if (!name) return
    const { data, error } = await supabase
      .from('objects')
      .insert([{ name, description: '' }])
    if (error) console.error(error)
    else setObjects(prev => [...prev, data[0]])
  }

  // Обновление объекта после редактирования (включая описание)
  const handleUpdateSelected = updatedObj => {
    setSelected(updatedObj)
    setObjects(prev => prev.map(o => o.id === updatedObj.id ? updatedObj : o))
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Левая панель: переключатель темы + список объектов */}
      <aside className="w-80 p-4 bg-white shadow flex flex-col">
        <ThemeSwitcher />
        <div className="mt-4 flex-1 overflow-auto">
          <h2 className="font-bold mb-3 text-lg">Объекты</h2>
          <div className="space-y-2">
            {objects.map(o => (
              <button
                key={o.id}
                onClick={() => setSelected(o)}
                className={`w-full text-left px-3 py-2 rounded transition-colors duration-150 ${
                  selected?.id === o.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleCreateObject}
          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white rounded py-2"
        >
          ➕ Добавить объект
        </button>
      </aside>

      {/* Основная область */}
      <main className="flex-1 p-6 overflow-auto">
        {!selected ? (
          <div className="text-gray-400 text-xl text-center mt-20">
            Выберите объект слева
          </div>
        ) : (
          <InventoryTabs
            selected={selected}
            onUpdateSelected={handleUpdateSelected}
          />
        )}
      </main>
    </div>
  )
}
