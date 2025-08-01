import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ThemeSwitcher from './components/ThemeSwitcher';
import InventorySidebar from './components/InventorySidebar';
import InventoryTabs from './components/InventoryTabs';

export default function App() {
  const [objects, setObjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => { fetchObjects(); }, []);

  async function fetchObjects() {
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Ошибка загрузки объектов:', error);
    } else {
      setObjects(data);
      if (!selected && data.length) setSelected(data[0]);
    }
  }

  async function addObject() {
    const name = prompt('Введите название нового объекта:');
    if (!name) return;
    const { data, error } = await supabase
      .from('objects')
      .insert([{ name, description: '' }])
      .select()
      .single();
    if (error) {
      alert('Ошибка добавления: ' + error.message);
    } else {
      setObjects(prev => [...prev, data]);
      setSelected(data);
    }
  }

  async function deleteObject(id) {
    if (!confirm('Удалить объект?')) return;
    const { error } = await supabase
      .from('objects')
      .delete()
      .eq('id', id);
    if (error) {
      alert('Ошибка удаления: ' + error.message);
    } else {
      setObjects(prev => prev.filter(o => o.id !== id));
      if (selected?.id === id) setSelected(objects[0] || null);
    }
  }

  function handleSelect(obj) {
    setSelected(obj);
    setIsSidebarOpen(false);
  }

  function handleUpdateSelected(updated) {
    setSelected(updated);
    setObjects(prev => prev.map(o => (o.id === updated.id ? updated : o)));
  }

  function toggleSidebar() {
    setIsSidebarOpen(prev => !prev);
  }

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Загрузка объектов...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Сайдбар */}
      <aside className="hidden md:flex flex-col w-72 bg-gray-50 p-4 border-r shadow-lg overflow-y-auto">
        <InventorySidebar
          objects={objects}
          selected={selected}
          onSelect={handleSelect}
          onDelete={deleteObject}
        />
      </aside>

      {/* Мобильный дровер */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-10 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleSidebar} />
          <aside className="relative z-20 w-72 bg-gray-50 p-4 shadow-lg overflow-y-auto">
            <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={toggleSidebar}>✕</button>
            <InventorySidebar
              objects={objects}
              selected={selected}
              onSelect={handleSelect}
              onDelete={deleteObject}
            />
          </aside>
        </div>
      )}

      {/* Основная часть */}
      <div className="flex-1 flex flex-col">
        {/* Хэдер */}
        <header className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <button className="md:hidden text-2xl" onClick={toggleSidebar}>☰</button>
            <button className="btn btn-primary btn-sm" onClick={addObject}>➕ Добавить</button>
          </div>
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
