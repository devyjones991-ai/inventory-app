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

  // Пока нет выбранного объекта
  if (!selected) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Загрузка объектов...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Десктопный сайдбар */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-50 p-4 border-r shadow-lg overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Объекты</h2>
        <InventorySidebar
          objects={objects}
          selected={selected}
          onSelect={handleSelect}
        />
        <button
          className="mt-4 btn btn-primary btn-sm self-start"
          onClick={() => {/* TODO: добавить логику */}}
        >
          ➕ Добавить
        </button>
      </aside>

      {/* Мобильный дровер-сайдбар */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-10 flex">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleSidebar}
          />
          <aside className="relative z-20 w-64 bg-gray-50 p-4 shadow-lg overflow-y-auto">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={toggleSidebar}
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4">Объекты</h2>
            <InventorySidebar
              objects={objects}
              selected={selected}
              onSelect={handleSelect}
            />
            <button
              className="mt-4 btn btn-primary btn-sm self-start"
              onClick={() => {/* TODO: добавить логику */}}
            >
              ➕ Добавить
            </button>
          </aside>
        </div>
      )}

      {/* Основная область */}
      <div className="flex-1 flex flex-col">
        {/* Хэдер на мобилках */}
        <header className="flex items-center justify-between p-4 md:hidden border-b bg-white">
          <button onClick={toggleSidebar} className="text-2xl">
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
