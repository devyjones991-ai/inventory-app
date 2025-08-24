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
      <div className="flex h-screen bg-base-100 transition-colors">
        <aside className="hidden md:flex flex-col w-72 bg-white p-4 border-r shadow-sm overflow-y-auto transition-colors">
          <InventorySidebar
            objects={objects}
            selected={selected}
            onSelect={onSelect}
            onEdit={openEditModal}
            onDelete={setDeleteCandidate}
            notifications={notifications}
          />
        </aside>
        
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <aside className="fixed left-0 top-0 h-full w-72 bg-white p-4 shadow-lg z-20">
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
        
        {/* Main content */}
        <div className="flex-1 flex flex-col bg-base-100">
          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between p-4 border-b">
            <button onClick={toggleSidebar} className="btn btn-ghost btn-sm">
              ☰
            </button>
            <h1 className="text-lg font-semibold">Inventory</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsAccountModalOpen(true)}
                className="btn btn-ghost btn-sm"
              >
                👤
              </button>
            </div>
          </div>
          
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-semibold">{selected?.name || 'Inventory'}</h1>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={importInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => importInputRef.current?.click()}
                className="btn btn-outline btn-sm"
              >
                Import
              </button>
              <button
                onClick={exportToFile}
                className="btn btn-outline btn-sm"
              >
                Export
              </button>
              {(isAdmin || isManager) && (
                <button onClick={addAction} className="btn btn-primary btn-sm">
                  <PlusIcon className="w-4 h-4" />
                  Add Object
                </button>
              )}
              <ThemeToggle />
              <button
                onClick={() => setIsAccountModalOpen(true)}
                className="btn btn-ghost btn-sm"
              >
                👤
              </button>
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex-1 p-4">
            <InventoryTabs
              activeTab={activeTab}
              onTabChange={onTabChange}
              selected={selected}
              onUpdateSelected={onUpdateSelected}
              user={user}
              isAdmin={isAdmin}
              isManager={isManager}
              addAction={addAction}
            />
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={user}
        isAdmin={isAdmin}
        isManager={isManager}
      />
      
      <ConfirmModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={onConfirmDelete}
        title="Delete Object"
        message={`Are you sure you want to delete "${deleteCandidate?.name}"?`}
      />
    </>
  )
}