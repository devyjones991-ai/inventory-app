import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import InventorySidebar from '../components/InventorySidebar'
import InventoryTabs from '../components/InventoryTabs'
import AccountModal from '../components/AccountModal'
import ConfirmModal from '../components/ConfirmModal'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import ThemeToggle from '../components/ThemeToggle'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useObjectList } from '../hooks/useObjectList'
import { useObjectNotifications } from '../hooks/useObjectNotifications'
import { useDashboardModals } from '../hooks/useDashboardModals'

export default function DashboardPage() {
  const { user, isAdmin, isManager } = useAuth()
  const [activeTab, setActiveTab] = useState('desc')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const {
    objects,
    selected,
    fetchError,
    handleSelect,
    handleUpdateSelected,
    saveObject,
    deleteObject,
    importFromFile,
    exportToFile,
  } = useObjectList()

  const { notifications, clearNotifications } = useObjectNotifications(
    selected,
    activeTab,
    user,
  )

  const {
    isObjectModalOpen,
    objectName,
    setObjectName,
    editingObject,
    deleteCandidate,
    setDeleteCandidate,
    isAccountModalOpen,
    setIsAccountModalOpen,
    openAddModal,
    openEditModal,
    closeObjectModal,
  } = useDashboardModals()

  const [addAction, setAddAction] = useState(() => openAddModal)

  useEffect(() => {
    setAddAction(() => openAddModal)
  }, [openAddModal])

  const importInputRef = useRef(null)

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)

  const onSelect = (obj) => {
    handleSelect(obj)
    clearNotifications(obj.id)
    setActiveTab('desc')
    setIsSidebarOpen(false)
  }

  const onUpdateSelected = (updated) => {
    handleUpdateSelected(updated)
    clearNotifications(updated.id)
  }

  const onTabChange = (tab) => {
    setActiveTab(tab)
    if ((tab === 'tasks' || tab === 'chat') && selected) {
      clearNotifications(selected.id)
    }
  }

  const onSaveObject = async () => {
    const ok = await saveObject(objectName, editingObject)
    if (ok) closeObjectModal()
  }

  const onConfirmDelete = async () => {
    const ok = await deleteObject(deleteCandidate)
    if (ok) setDeleteCandidate(null)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      await importFromFile(file)
      e.target.value = ''
    }
  }

  if (!user) return <Navigate to="/auth" replace />

  if (fetchError) {
    return (
      <div className="flex w-full min-h-screen items-center justify-center bg-base-100 text-red-500">
        {fetchError}
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="flex w-full min-h-screen items-center justify-center bg-base-100 text-gray-500">
        Загрузка объектов...
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen w-full bg-base-100 transition-colors">
        <aside className="hidden md:flex flex-col w-72 bg-base-200 p-4 border-r shadow-lg overflow-y-auto transition-colors">
          <InventorySidebar
            objects={objects}
            selected={selected}
            onSelect={onSelect}
            onEdit={openEditModal}
            onDelete={setDeleteCandidate}
            notifications={notifications}
          />
        </aside>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-10 flex">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={toggleSidebar}
            />
            <aside className="relative z-20 w-72 bg-base-200 p-4 shadow-lg overflow-y-auto transition-colors">
              <button
                className="btn btn-circle btn-md md:btn-sm absolute right-2 top-2"
                onClick={toggleSidebar}
              >
                ✕
              </button>
              <InventorySidebar
                objects={objects}
                selected={selected}
                onSelect={onSelect}
                onEdit={openEditModal}
                onDelete={setDeleteCandidate}
                notifications={notifications}
              />
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <header className="flex flex-col xs:items-start xs:gap-2 md:flex-row items-center justify-between p-4 border-b bg-base-100 transition-colors">
            <div className="flex items-center gap-2">
              <button className="md:hidden p-2 text-lg" onClick={toggleSidebar}>
                ☰
              </button>
              <button
                className="btn btn-primary btn-md md:btn-sm flex items-center gap-1"
                onClick={addAction}
              >
                <PlusIcon className="w-4 h-4" /> Добавить
              </button>
              {(isAdmin || isManager) && (
                <>
                  <button
                    className="btn btn-secondary btn-md md:btn-sm"
                    onClick={() => importInputRef.current?.click()}
                  >
                    Импорт
                  </button>
                  <button
                    className="btn btn-secondary btn-md md:btn-sm"
                    onClick={exportToFile}
                  >
                    Экспорт
                  </button>
                  <input
                    type="file"
                    accept=".csv"
                    ref={importInputRef}
                    className="hidden"
                    onChange={handleImport}
                  />
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                className="btn btn-md md:btn-sm p-2 text-lg md:text-sm"
                onClick={() => setIsAccountModalOpen(true)}
              >
                {user.user_metadata?.username || 'Аккаунт'}
              </button>
              <button
                className="btn btn-md md:btn-sm p-2 text-lg md:text-sm"
                onClick={() => supabase.auth.signOut()}
              >
                Выйти
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <InventoryTabs
              selected={selected}
              onUpdateSelected={onUpdateSelected}
              onTabChange={onTabChange}
              setAddAction={setAddAction}
              openAddObject={openAddModal}
            />
          </div>
        </div>

        {isObjectModalOpen && (
          <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-box relative w-full max-w-md">
              <button
                className="btn btn-circle btn-md md:btn-sm absolute right-2 top-2"
                onClick={closeObjectModal}
              >
                ✕
              </button>
              <h3 className="font-bold text-lg mb-4">
                {editingObject ? 'Редактировать объект' : 'Добавить объект'}
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Название"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                />
              </div>
              <div className="modal-action flex space-x-2">
                <button className="btn btn-primary" onClick={onSaveObject}>
                  Сохранить
                </button>
                <button className="btn btn-ghost" onClick={closeObjectModal}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!deleteCandidate}
          title="Удалить объект?"
          confirmLabel={
            <>
              <TrashIcon className="w-4 h-4" /> Удалить
            </>
          }
          onConfirm={onConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />

        {isAccountModalOpen && (
          <AccountModal
            user={user}
            onClose={() => setIsAccountModalOpen(false)}
            onUpdated={() => {}}
          />
        )}
      </div>
    </>
  )
}
