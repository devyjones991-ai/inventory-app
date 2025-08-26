import React, { useState, useRef } from 'react'
import InventorySidebar from '../components/InventorySidebar'
import InventoryTabs from '../components/InventoryTabs'
import AccountModal from '../components/AccountModal'
import ConfirmModal from '../components/ConfirmModal'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import ThemeToggle from '../components/ThemeToggle'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { useObjectList } from '../hooks/useObjectList'
import { useObjectNotifications } from '../hooks/useObjectNotifications'
import { useDashboardModals } from '../hooks/useDashboardModals'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, isAdmin, isManager } = useAuth()
  const { signOut } = useSupabaseAuth()
  const [activeTab, setActiveTab] = useState('desc')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const {
    objects,
    selected,
    fetchError,
    isEmpty,
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
      <div className="flex w-full min-h-screen items-center justify-center bg-background text-red-500">
        {fetchError}
      </div>
    )
  }

  if (!selected) {
    if (isEmpty) {
      return (
        <div className="flex w-full min-h-screen items-center justify-center bg-background text-gray-500">
          Объекты отсутствуют
        </div>
      )
    }
    return (
      <div className="flex w-full min-h-screen items-center justify-center bg-background text-gray-500">
        Загрузка объектов...
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        <aside className="hidden md:flex flex-col w-72 bg-muted p-4 border-r shadow-lg overflow-y-auto">
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
            <aside className="relative z-20 w-72 bg-muted p-4 shadow-lg overflow-y-auto">
              <Button
                size="icon"
                className="absolute right-2 top-2"
                onClick={toggleSidebar}
              >
                ✕
              </Button>
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
          <header className="flex flex-col xs:items-start xs:gap-2 md:flex-row items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-2">
              <button className="md:hidden p-2 text-lg" onClick={toggleSidebar}>
                ☰
              </button>
              <Button
                className="flex items-center gap-1"
                onClick={openAddModal}
              >
                <PlusIcon className="w-4 h-4" /> Добавить
              </Button>
              {(isAdmin || isManager) && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => importInputRef.current?.click()}
                  >
                    Импорт
                  </Button>
                  <Button variant="secondary" onClick={exportToFile}>
                    Экспорт
                  </Button>
                  <Input
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
              <Button
                className="p-2 text-lg md:text-sm"
                onClick={() => setIsAccountModalOpen(true)}
              >
                {user.user_metadata?.username || 'Аккаунт'}
              </Button>
              <Button className="p-2 text-lg md:text-sm" onClick={signOut}>
                Выйти
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <InventoryTabs
              selected={selected}
              onUpdateSelected={onUpdateSelected}
              onTabChange={onTabChange}
            />
          </div>
        </div>

        {isObjectModalOpen && (
          <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-box relative w-full max-w-md">
              <Button
                size="icon"
                className="absolute right-2 top-2"
                onClick={closeObjectModal}
              >
                ✕
              </Button>
              <h3 className="font-bold text-lg mb-4">
                {editingObject ? 'Редактировать объект' : 'Добавить объект'}
              </h3>
              <div className="space-y-4">
                <Input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Название"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                />
              </div>
              <div className="modal-action flex space-x-2">
                <Button onClick={onSaveObject}>Сохранить</Button>
                <Button variant="ghost" onClick={closeObjectModal}>
                  Отмена
                </Button>
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
