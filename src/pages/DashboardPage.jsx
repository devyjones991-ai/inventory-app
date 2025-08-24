
import React, { useState, useRef } from 'react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'


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
          <header className="flex flex-col xs:items-start xs:gap-2 md:flex-row items-center justify-between p-4 border-b bg-base-100 transition-colors">
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

                  </button>
                  <Input

                  </Button>
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
              <Button
                className="p-2 text-lg md:text-sm"
                onClick={() => setIsAccountModalOpen(true)}
              >
                {user.user_metadata?.username || 'Аккаунт'}
              </Button>
              <Button
                className="p-2 text-lg md:text-sm"
                onClick={() => supabase.auth.signOut()}
              >
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

166          className="btn btn-ghost btn-sm"
167        >
168          👤
169        </button>
170      </div>
171    </div>
172
173    {/* Desktop header */}
174    <div className="hidden md:flex items-center justify-between p-4 border-b">
175      <h1 className="text-xl font-semibold">{selected?.name || 'Inventory'}</h1>
176      <div className="flex items-center gap-2">
177        <input
178          type="file"
179          ref={importInputRef}
180          onChange={handleImport}
181          accept=".json"
182          className="hidden"
183        />
184        <button
185          onClick={() => importInputRef.current?.click()}
186          className="btn btn-outline btn-sm"
187        >
188          Import
189        </button>
190        <button
191          onClick={exportToFile}
192          className="btn btn-outline btn-sm"
193        >
194          Export
195        </button>
196        {(isAdmin || isManager) && (
197          <button onClick={addAction} className="btn btn-primary btn-sm">
198            <PlusIcon className="w-4 h-4" />
199            Add Object
200          </button>
201        )}
202        <ThemeToggle />
203        <button
204          onClick={() => setIsAccountModalOpen(true)}
205          className="btn btn-ghost btn-sm"
206        >
207          👤
208        </button>
209      </div>
210    </div>
211
212    {/* Content area */}
213    <div className="flex-1 p-4">
214      <InventoryTabs
215        activeTab={activeTab}
216        onTabChange={onTabChange}
217        selected={selected}
218        onUpdateSelected={onUpdateSelected}
219        user={user}
220        isAdmin={isAdmin}
221        isManager={isManager}
222        addAction={addAction}
223      />
224    </div>
225
226    {/* Modals */}
227    <Dialog open={isObjectModalOpen} onOpenChange={closeObjectModal}>
228      <DialogContent>
229        <DialogHeader>
230          <DialogTitle>
231            {editingObject ? 'Редактировать объект' : 'Добавить объект'}
232          </DialogTitle>
233        </DialogHeader>
234        <div className="space-y-4">
235          <input
236            type="text"
237            className="input input-bordered w-full"
238            placeholder="Название"
239            value={objectName}
240            onChange={(e) => setObjectName(e.target.value)}
241          />
242        </div>
243        <DialogFooter>
244          <button className="btn btn-primary" onClick={onSaveObject}>
245            Сохранить
246          </button>
247          <button className="btn btn-ghost" onClick={closeObjectModal}>
248            Отмена
249          </button>
250        </DialogFooter>
251      </DialogContent>
252    </Dialog>
253
254    <ConfirmModal
255      open={!!deleteCandidate}
256      title="Удалить объект?"
257      confirmLabel={
258        <>
259          <TrashIcon className="w-4 h-4" /> Удалить
260        </>
261      }
262      onConfirm={onConfirmDelete}
263      onCancel={() => setDeleteCandidate(null)}
264    />
265
266    {isAccountModalOpen && (
267      <AccountModal
268        user={user}
269        onClose={() => setIsAccountModalOpen(false)}
270        onUpdated={() => {}}
271      />
272    )}
273  </div>
274)

