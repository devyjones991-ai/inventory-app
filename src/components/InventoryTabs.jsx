import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../supabaseClient'
import { handleSupabaseError } from '../utils/handleSupabaseError'
import HardwareCard from './HardwareCard'
import ChatTab from './ChatTab'
import TasksTab from './TasksTab'
import { PlusIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline'
import { linkifyText } from '../utils/linkify'
import { toast } from 'react-hot-toast'
import ConfirmModal from './ConfirmModal'
import Spinner from './Spinner'
import ErrorMessage from './ErrorMessage'
import { useHardware } from '../hooks/useHardware'
import { useChatMessages } from '../hooks/useChatMessages'
import { useObjects } from '../hooks/useObjects'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { apiBaseUrl, isApiConfigured } from '../apiConfig'

const TAB_KEY = (objectId) => `tab_${objectId}`
const HW_MODAL_KEY = (objectId) => `hwModal_${objectId}`
const HW_FORM_KEY = (objectId) => `hwForm_${objectId}`
const PAGE_SIZE = 20

function InventoryTabs({ selected, onUpdateSelected, onTabChange = () => {} }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  // --- вкладки и описание ---
  const [tab, setTab] = useState('desc')
  const [description, setDescription] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)

  const showDesc = useCallback(() => setTab('desc'), [])
  const showHW = useCallback(() => setTab('hw'), [])
  const showTasks = useCallback(() => setTab('tasks'), [])
  const showChat = useCallback(() => setTab('chat'), [])

  // --- оборудование ---
  const [hardware, setHardware] = useState([])
  const [isHWModalOpen, setIsHWModalOpen] = useState(false)
  const [editingHW, setEditingHW] = useState(null)
  const defaultHWForm = {
    name: '',
    location: '',
    purchase_status: 'не оплачен',
    install_status: 'не установлен',
  }
  const hardwareSchema = z.object({
    name: z.string().min(1, 'Введите название'),
    location: z.string().optional(),
    purchase_status: z.enum(['не оплачен', 'оплачен'], {
      message: 'Недопустимый статус покупки',
    }),
    install_status: z.enum(['не установлен', 'установлен'], {
      message: 'Недопустимый статус установки',
    }),
  })
  const {
    register: registerHW,
    handleSubmit: handleSubmitHW,
    reset: resetHW,
    watch: watchHW,
    formState: { errors: hwErrors },
  } = useForm({
    resolver: zodResolver(hardwareSchema),
    defaultValues: defaultHWForm,
  })
  const [hwDeleteId, setHwDeleteId] = useState(null)
  const hwEffectRan = React.useRef(false)
  const [hardwareError, setHardwareError] = useState(null)
  const [hardwarePage, setHardwarePage] = useState(0)
  const [hardwareHasMore, setHardwareHasMore] = useState(true)
  const [loadingHW, setLoadingHW] = useState(false)

  // --- импорт/экспорт ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)

  // --- чат ---
  const [chatMessages, setChatMessages] = useState([])
  const {
    fetchHardware: fetchHardwareApi,
    insertHardware,
    updateHardware,
    deleteHardware,
  } = useHardware()
  const { fetchMessages, subscribeToMessages } = useChatMessages()
  const { updateObject } = useObjects()
  // загрузка данных при смене объекта и восстановление состояния UI
  useEffect(() => {
    if (!selected) return
    const savedTab =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(TAB_KEY(selected.id))
        : null
    setTab(savedTab || 'desc')
    const savedHWForm =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(HW_FORM_KEY(selected.id))
        : null
    const savedHWOpen =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(HW_MODAL_KEY(selected.id)) === 'true'
        : false
    let parsedHWForm = defaultHWForm
    if (savedHWForm) {
      try {
        parsedHWForm = JSON.parse(savedHWForm)
      } catch {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(HW_FORM_KEY(selected.id))
        }
      }
    }
    resetHW(parsedHWForm)
    if (savedHWOpen && typeof localStorage !== 'undefined') {
      localStorage.setItem(
        HW_FORM_KEY(selected.id),
        JSON.stringify(parsedHWForm),
      )
    }
    setIsHWModalOpen(savedHWOpen)
    setDescription(selected.description || '')

    setHardware([])
    setChatMessages([])

    setHardwarePage(0)
    setHardwareHasMore(true)
    setHardwareError(null)

    fetchHardware(selected.id, 0)
    fetchMessages(selected.id).then(({ data, error }) => {
      if (error) {
        if (error.status === 403) toast.error('Недостаточно прав')
        else toast.error('Ошибка загрузки сообщений: ' + error.message)
      } else setChatMessages(data || [])
    })
  }, [selected])

  useEffect(() => {
    onTabChange(tab)
  }, [tab, onTabChange])

  useEffect(() => {
    if (!selected) return
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TAB_KEY(selected.id), tab)
    }
  }, [tab, selected])

  useEffect(() => {
    if (!selected) return
    if (hwEffectRan.current) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(HW_MODAL_KEY(selected.id), isHWModalOpen)
        if (!isHWModalOpen) {
          localStorage.removeItem(HW_FORM_KEY(selected.id))
        }
      }
    } else {
      hwEffectRan.current = true
    }
  }, [isHWModalOpen, selected])

  useEffect(() => {
    if (!selected || !isHWModalOpen) return
    const sub = watchHW((value) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(HW_FORM_KEY(selected.id), JSON.stringify(value))
      }
    })
    return () => sub.unsubscribe()
  }, [watchHW, selected, isHWModalOpen])

  // realtime обновление чата
  useEffect(() => {
    if (!selected) return
    const unsubscribeChat = subscribeToMessages(selected.id, (payload) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === payload.new.id)) return prev
        return [...prev, payload.new]
      })
    })

    return () => {
      unsubscribeChat()
    }
  }, [selected])

  // --- CRUD Описание ---
  async function saveDescription() {
    const { data, error } = await updateObject(selected.id, { description })
    if (!error) {
      onUpdateSelected({ ...selected, description: data.description })
      setIsEditingDesc(false)
    } else {
      if (error.status === 403) toast.error('Недостаточно прав')
      else toast.error('Ошибка сохранения описания: ' + error.message)
    }
  }

  // --- CRUD Оборудование ---

  async function fetchHardware(objectId, page = hardwarePage) {
    setLoadingHW(true)

    setHardwareError(null)
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('hardware')
      .select('id, name, location, purchase_status, install_status')
      .eq('object_id', objectId)
      .order('created_at')
      .range(from, to)
    if (error) {
      setHardwareError(error)

      if (error.status === 403) toast.error('Недостаточно прав')
      else toast.error('Ошибка загрузки оборудования: ' + error.message)

      await handleSupabaseError(error, navigate, 'Ошибка загрузки оборудования')
      setLoadingHW(false)
      return
    } else {
      setHardware((prev) => [...prev, ...(data || [])])
      if (!data || data.length < PAGE_SIZE) {
        setHardwareHasMore(false)
      } else {
        setHardwarePage(page + 1)
      }
    }
    const { data: apiData, error: apiError } = await fetchHardwareApi(objectId)
    if (apiError) {
      if (apiError.status === 403) toast.error('Недостаточно прав')
      else toast.error('Ошибка загрузки оборудования: ' + apiError.message)
    } else setHardware(apiData || [])

    setLoadingHW(false)
  }

  function openHWModal(item = null) {
    if (item) {
      setEditingHW(item)
      resetHW({
        name: item.name,
        location: item.location,
        purchase_status: item.purchase_status,
        install_status: item.install_status,
      })
    } else {
      setEditingHW(null)
      resetHW({ ...defaultHWForm })
    }
    setIsHWModalOpen(true)
  }
  async function saveHardware(data) {
    const payload = { object_id: selected.id, ...data }
    let res
    if (editingHW) {
      res = await updateHardware(editingHW.id, payload)
    } else {
      res = await insertHardware(payload)
    }

    if (res.error) {
      res.error.status === 403
        ? toast.error('Недостаточно прав')
        : toast.error('Ошибка оборудования: ' + res.error.message)
      await handleSupabaseError(res.error, navigate, 'Ошибка оборудования')
      return
    }

    const rec = res.data
    setHardware((prev) =>
      editingHW ? prev.map((h) => (h.id === rec.id ? rec : h)) : [...prev, rec],
    )
    setIsHWModalOpen(false)
    setEditingHW(null)
    resetHW({ ...defaultHWForm })
  }
  function askDeleteHardware(id) {
    setHwDeleteId(id)
  }
  async function confirmDeleteHardware() {
    const id = hwDeleteId
    const { error } = await deleteHardware(id)

    if (error)
      return error.status === 403
        ? toast.error('Недостаточно прав')
        : toast.error('Ошибка удаления: ' + error.message)

    setHardware((prev) => prev.filter((h) => h.id !== id))
    setHwDeleteId(null)
  }

  // --- экспорт/импорт ---
  function openImportModal() {
    setIsImportModalOpen(true)
    setImportFile(null)
  }

  function closeImportModal() {
    setIsImportModalOpen(false)
    setImportFile(null)
  }

  async function handleImport() {
    if (!importFile) return
    if (!isApiConfigured) {
      toast.error('API не настроен')
      return
    }
    const formData = new FormData()
    formData.append('file', importFile)
    try {
      const res = await fetch(`${apiBaseUrl}/import/hardware`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Ошибка импорта')
      toast.success('Импорт выполнен')
      closeImportModal()
      setHardware([])
      setHardwarePage(0)
      setHardwareHasMore(true)
      await fetchHardware(selected.id, 0)
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function handleExport(format = 'csv') {
    if (!isApiConfigured) {
      toast.error('API не настроен')
      return
    }
    try {
      const res = await fetch(`${apiBaseUrl}/export/hardware.${format}`)
      if (!res.ok) throw new Error('Ошибка экспорта')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hardware.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Вкладки */}
      <div className="flex mb-4 border-b">
        <button
          className={`px-4 py-2 hover:bg-primary/10 ${tab === 'desc' ? 'border-b-2 border-primary' : ''}`}
          onClick={showDesc}
        >
          Описание
        </button>
        <button
          className={`px-4 py-2 hover:bg-primary/10 ${tab === 'hw' ? 'border-b-2 border-primary' : ''}`}
          onClick={showHW}
        >
          Железо ({hardware.length})
        </button>
        <button
          className={`px-4 py-2 hover:bg-primary/10 ${tab === 'tasks' ? 'border-b-2 border-primary' : ''}`}
          onClick={showTasks}
        >
          Задачи
        </button>
        <button
          className={`px-4 py-2 hover:bg-primary/10 flex items-center gap-1 ${tab === 'chat' ? 'border-b-2 border-primary' : ''}`}
          onClick={showChat}
        >
          <ChatBubbleOvalLeftIcon className="w-4 h-4" /> Чат (
          {chatMessages.length})
        </button>
      </div>

      <div className="flex-1 flex flex-col h-full min-h-0 overflow-auto p-4">
        {/* Описание */}
        {tab === 'desc' && (
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{selected.name}</h3>
              {!isEditingDesc && (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setIsEditingDesc(true)}
                >
                  Редактировать
                </button>
              )}
            </div>
            {isEditingDesc ? (
              <>
                <textarea
                  className="textarea textarea-bordered w-full mt-4"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="mt-2 flex space-x-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={saveDescription}
                  >
                    Сохранить
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsEditingDesc(false)}
                  >
                    Отмена
                  </button>
                </div>
              </>
            ) : description ? (
              <p className="mt-2 whitespace-pre-wrap break-all">
                {linkifyText(description)}
              </p>
            ) : (
              <p className="mt-2">Нет описания</p>
            )}
          </div>
        )}

        {/* Оборудование */}
        {tab === 'hw' && (
          <div>
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-semibold">Оборудование</h3>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleExport()}
                >
                  Экспорт
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={openImportModal}
                >
                  Импорт
                </button>
                <button
                  className="btn btn-sm btn-primary flex items-center gap-1"
                  onClick={() => openHWModal()}
                >
                  <PlusIcon className="w-4 h-4" /> Добавить
                </button>
              </div>
            </div>
            {loadingHW && <Spinner />}
            {hardwareError && (
              <ErrorMessage
                error={hardwareError}
                message="Ошибка загрузки оборудования"
              />
            )}
            {!loadingHW && !hardwareError && (
              <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {hardware.map((h) => (
                  <HardwareCard
                    key={h.id}
                    item={h}
                    onEdit={() => openHWModal(h)}
                    onDelete={() => askDeleteHardware(h.id)}
                    user={user}
                  />
                ))}
              </div>
            )}
            {hardwareHasMore && !loadingHW && (
              <button
                className="btn btn-outline btn-sm mt-2"
                onClick={() => fetchHardware(selected.id, hardwarePage)}
              >
                Загрузить ещё
              </button>
            )}

            {isHWModalOpen && (
              <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto animate-fade-in">
                  <button
                    className="btn btn-circle absolute right-2 top-2 xs:btn-md md:btn-sm"
                    onClick={() => setIsHWModalOpen(false)}
                  >
                    ✕
                  </button>
                  <h3 className="font-bold text-lg mb-4">
                    {editingHW ? 'Редактировать' : 'Добавить'} оборудование
                  </h3>

                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Название устройства</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Например, keenetic giga"
                        {...registerHW('name')}
                      />
                      {hwErrors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {hwErrors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Местоположение</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Где стоит"
                        {...registerHW('location')}
                      />
                      {hwErrors.location && (
                        <p className="text-red-500 text-sm mt-1">
                          {hwErrors.location.message}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm2:flex-row sm2:space-x-4 space-y-4 sm2:space-y-0">
                      <div className="form-control flex-1">
                        <label className="label">
                          <span className="label-text">Статус покупки</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          {...registerHW('purchase_status')}
                        >
                          <option value="не оплачен">Не оплачен</option>
                          <option value="оплачен">Оплачен</option>
                        </select>
                        {hwErrors.purchase_status && (
                          <p className="text-red-500 text-sm mt-1">
                            {hwErrors.purchase_status.message}
                          </p>
                        )}
                      </div>
                      <div className="form-control flex-1">
                        <label className="label">
                          <span className="label-text">Статус установки</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          {...registerHW('install_status')}
                        >
                          <option value="не установлен">Не установлен</option>
                          <option value="установлен">Установлен</option>
                        </select>
                        {hwErrors.install_status && (
                          <p className="text-red-500 text-sm mt-1">
                            {hwErrors.install_status.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-action flex space-x-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmitHW(saveHardware)}
                    >
                      Сохранить
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setIsHWModalOpen(false)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            <ConfirmModal
              open={!!hwDeleteId}
              title="Удалить оборудование?"
              onConfirm={confirmDeleteHardware}
              onCancel={() => setHwDeleteId(null)}
            />
          </div>
        )}

        {/* Задачи */}
        {tab === 'tasks' && (
          <TasksTab selected={selected} onUpdateSelected={onUpdateSelected} />
        )}

        {isImportModalOpen && (
          <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto animate-fade-in">
              <button
                className="btn btn-circle absolute right-2 top-2 xs:btn-md md:btn-sm"
                onClick={closeImportModal}
              >
                ✕
              </button>
              <h3 className="font-bold text-lg mb-4">Импорт оборудования</h3>
              <input
                type="file"
                className="file-input file-input-bordered w-full"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
              <div className="modal-action flex space-x-2">
                <button className="btn btn-primary" onClick={handleImport}>
                  Загрузить
                </button>
                <button className="btn btn-ghost" onClick={closeImportModal}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Чат */}
        {tab === 'chat' && (
          <ChatTab
            key={selected?.id}
            selected={selected}
            userEmail={user?.email}
          />
        )}
      </div>
    </div>
  )
}

export default React.memo(InventoryTabs)

InventoryTabs.propTypes = {
  selected: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  onUpdateSelected: PropTypes.func.isRequired,
  onTabChange: PropTypes.func,
}
