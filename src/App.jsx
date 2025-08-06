import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import InventorySidebar from './components/InventorySidebar';
import InventoryTabs from './components/InventoryTabs';
import Auth from './components/Auth';
import AccountModal from './components/AccountModal';
import { Toaster, toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { requestNotificationPermission } from './utils/notifications';

export default function App() {
  const [objects, setObjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newObjectName, setNewObjectName] = useState('');
    const [deleteCandidate, setDeleteCandidate] = useState(null);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  useEffect(() => {
    requestNotificationPermission();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Загрузка списка объектов
  useEffect(() => {
    fetchObjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Добавление объекта через модальное окно
  async function saveNewObject() {
    if (!newObjectName.trim()) return;
    const { data, error } = await supabase
      .from('objects')
      .insert([{ name: newObjectName, description: '' }])
      .select()
      .single();
    if (error) {
      toast.error('Ошибка добавления: ' + error.message);
    } else {
      setObjects(prev => [...prev, data]);
      setSelected(data);
      setNewObjectName('');
      setIsAddModalOpen(false);
    }
  }

  // Запрос на удаление с подтверждением
  function askDelete(id) {
    setDeleteCandidate(id);
  }

  async function confirmDelete() {
    const id = deleteCandidate;
    const { error } = await supabase
      .from('objects')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Ошибка удаления: ' + error.message);
    } else {
      setObjects(prev => {
        const updated = prev.filter(o => o.id !== id);
        if (selected?.id === id) {
          setSelected(updated[0] || null);
        }
        return updated;
      });
      setDeleteCandidate(null);
      toast.success('Объект удалён');
    }
  }

  // Редактирование объекта
  async function editObject(obj) {
    const name = prompt('Введите новое название объекта:', obj.name);
    if (!name) return;
    const { data, error } = await supabase
      .from('objects')
      .update({ name })
      .eq('id', obj.id)
      .select()
      .single();
    if (error) {
      alert('Ошибка редактирования: ' + error.message);
    } else {
      setObjects(prev => prev.map(o => (o.id === obj.id ? data : o)));
      if (selected?.id === obj.id) setSelected(data);
    }
  }

  function handleSelect(obj) {
    setSelected(obj);
    // закрываем сайдбар на мобильных устройствах после выбора объекта
    setIsSidebarOpen(false);
  }

  function handleUpdateSelected(updated) {
    setSelected(updated);
    setObjects(prev => prev.map(o => (o.id === updated.id ? updated : o)));
  }

  function toggleSidebar() {
    setIsSidebarOpen(prev => !prev);
  }

  function handleUserUpdated(updated) {
    setUser(updated);
  }

  if (!user) return <Auth />;

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Загрузка объектов...
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-white">
        <Toaster position="top-right" />
        {/* Десктоп- и мобайл-сайдбар */}
        <aside className="hidden md:flex flex-col w-72 bg-gray-50 p-4 border-r shadow-lg overflow-y-auto">
          <InventorySidebar
            objects={objects}
            selected={selected}
            onSelect={handleSelect}
            onEdit={editObject}
            onDelete={askDelete}
          />
        </aside>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-10 flex">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={toggleSidebar}
            />
            <aside className="relative z-20 w-72 bg-gray-50 p-4 shadow-lg overflow-y-auto">
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
                onEdit={editObject}
                onDelete={askDelete}
              />
            </aside>
          </div>
        )}

        {/* Основная часть */}
        <div className="flex-1 flex flex-col">
          {/* Хэдер с одной фиолетовой кнопкой */}
          <header className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <button
                className="md:hidden text-2xl"
                onClick={toggleSidebar}
              >
                ☰
              </button>
              <button
                className="btn btn-primary btn-sm flex items-center gap-1"
                onClick={() => setIsAddModalOpen(true)}
              >
                <PlusIcon className="w-4 h-4" /> Добавить
              </button>
            </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-sm" onClick={() => setIsAccountModalOpen(true)}>
                  {user.user_metadata?.username || 'Аккаунт'}
                </button>
                <button className="btn btn-sm" onClick={() => supabase.auth.signOut()}>Выйти</button>
              </div>
            </header>

          {/* Контент табов */}
          <div className="flex-1 overflow-auto">
            <InventoryTabs
              selected={selected}
              onUpdateSelected={handleUpdateSelected}
              user={user}
            />
          </div>
        </div>

        {/* Модальное добавление объекта */}
        {isAddModalOpen && (
          <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-box relative w-full max-w-md">
              <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={() => setIsAddModalOpen(false)}>✕</button>
              <h3 className="font-bold text-lg mb-4">Добавить объект</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Название"
                  value={newObjectName}
                  onChange={e => setNewObjectName(e.target.value)}
                />
              </div>
              <div className="modal-action flex space-x-2">
                <button className="btn btn-primary" onClick={saveNewObject}>Сохранить</button>
                <button className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное подтверждение удаления */}
        {deleteCandidate && (
          <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-box relative w-full max-w-sm">
              <h3 className="font-bold text-lg mb-4">Удалить объект?</h3>
              <div className="modal-action flex space-x-2">
                <button className="btn btn-error flex items-center gap-1" onClick={confirmDelete}>
                  <TrashIcon className="w-4 h-4" /> Удалить
                </button>
                <button className="btn" onClick={() => setDeleteCandidate(null)}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {isAccountModalOpen && (
          <AccountModal
            user={user}
            onClose={() => setIsAccountModalOpen(false)}
            onUpdated={handleUserUpdated}
          />
        )}
      </div>
    </>
  );
}
