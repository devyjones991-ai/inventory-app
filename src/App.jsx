import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ThemeSwitcher from './components/ThemeSwitcher';
import InventorySidebar from './components/InventorySidebar';
import InventoryTabs from './components/InventoryTabs';

export default function App() {
  const [objects, setObjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Загрузка списка объектов при монтировании
  useEffect(() => {
    fetchObjects();
  }, []);

  async function fetchObjects() {
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Ошибка загрузки объектов:', error);
    } else {
      setObjects(data);
      if (data.length > 0 && !selected) {
        setSelected(data[0]);
      }
    }
  }

  function handleSelect(obj) {
    setSelected(obj);
    setIsSidebarOpen(false);
  }

  function handleUpdateSelected(updated) {
    setSelected(updated);
    setObjects(prev => prev.map(o => o.id === updated.id ? updated : o));
  }

  function toggleSidebar() {
    setIsSidebarOpen(prev => !prev);
  }

  // Если ещё нет выбранного объекта
  if (!selected) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Загрузка объектов...
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Десктопный сайдбар */}
      <aside className="hidden md:block w-64 border-r overflow-auto">
        <InventorySidebar
          objects={objects}
          selected={selected}
          onSelect={handleSelect}
        />
      </aside>

      {/* Мобильный дровер-сайдбар */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-10 flex">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleSidebar}
          />
          <aside className="relative z-20 w-64 bg-white p-4 overflow-auto">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={toggleSidebar}
            >
              ✕
            </button>
            <InventorySidebar
              objects={objects}
              selected={selected}
              onSelect={handleSelect}
            />
          </aside>
        </div>
      )}

      {/* Основная область */}
      <div className="flex-1 flex flex-col">
        {/* Хэдер на мобилках */}
        <header className="flex items-center justify-between p-4 md:hidden border-b">
          <button onClick={toggleSidebar} className="text-xl">
            ☰
          </button>
          <ThemeSwitcher />
        </header>

        {/* Контент */}
        <div className="flex-1 overflow-auto">
          <InventoryTabs
            selected={selected}
            onUpdateSelected={handleUpdateSelected}
          />
        </div>
      </div>
    </div>
  );
}
