import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import usePersistedForm from '../hooks/usePersistedForm'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import HardwareCard from './HardwareCard'
import ChatTab from './ChatTab'
import TasksTab from './TasksTab'
import { PlusIcon } from '@heroicons/react/24/outline'
import { linkifyText } from '../utils/linkify'
import { useHardware } from '../hooks/useHardware'
import { useObjects } from '../hooks/useObjects'
import { useAuth } from '../hooks/useAuth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const HW_FORM_KEY = (objectId) => `hwForm_${objectId}`

function InventoryTabs({ selected, onUpdateSelected, onTabChange = () => {} }) {
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
      required_error: 'Выберите статус покупки',
    }),
    install_status: z.enum(['не установлен', 'установлен'], {
      required_error: 'Выберите статус установки',
    }),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = usePersistedForm(
    selected ? HW_FORM_KEY(selected.id) : null,
    defaultHWForm,
    isHWModalOpen,
    { resolver: zodResolver(hardwareSchema) },
  )

  const {
    hardware: loadedHardware = [],
    loadHardware,
    createHardware,
    updateHardware,
    deleteHardware,
  } = useHardware(selected?.id)

  useEffect(() => {
    if (selected?.id) {
      loadHardware(selected.id)
    }
  }, [selected?.id, loadHardware])

  useEffect(() => {
    setHardware(loadedHardware)
  }, [loadedHardware])

  const openHWModal = useCallback(() => {
    reset(defaultHWForm)
    setEditingHW(null)
    setIsHWModalOpen(true)
  }, [reset])

  const closeHWModal = useCallback(() => {
    setIsHWModalOpen(false)
  }, [])

  const handleHWSubmit = handleSubmit(async (data) => {
    if (!selected?.id) return
    if (editingHW) {
      await updateHardware(editingHW.id, data)
    } else {
      await createHardware({ ...data, object_id: selected.id })
    }
    setIsHWModalOpen(false)
    reset(defaultHWForm)
  })

  const handleEditHW = useCallback(
    (item) => {
      reset(item)
      setEditingHW(item)
      setIsHWModalOpen(true)
    },
    [reset],
  )

  const handleDeleteHW = useCallback(
    async (item) => {
      await deleteHardware(item.id)
    },
    [deleteHardware],
  )

  const { updateObject } = useObjects()

  useEffect(() => {
    if (selected) {
      setDescription(selected.description || '')
    }
  }, [selected])

  const saveDescription = useCallback(async () => {
    if (!selected) return
    await updateObject(selected.id, { description })
    onUpdateSelected({ ...selected, description })
    setIsEditingDesc(false)
  }, [selected, description, updateObject, onUpdateSelected])

  useEffect(() => {
    onTabChange(tab)
  }, [tab, onTabChange])

  return (
    <div className="flex flex-col h-full">
      <div className="tabs mb-4">
        <button
          className={`tab tab-bordered ${tab === 'desc' ? 'tab-active' : ''}`}
          onClick={showDesc}
        >
          Описание
        </button>
        <button
          className={`tab tab-bordered ${tab === 'hw' ? 'tab-active' : ''}`}
          onClick={showHW}
        >
          Железо
        </button>
        <button
          className={`tab tab-bordered ${tab === 'tasks' ? 'tab-active' : ''}`}
          onClick={showTasks}
        >
          Задачи
        </button>
        <button
          className={`tab tab-bordered ${tab === 'chat' ? 'tab-active' : ''}`}
          onClick={showChat}
        >
          Чат
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {tab === 'desc' && (
          <div className="space-y-2">
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={saveDescription}
                  >
                    Сохранить
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setIsEditingDesc(false)}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="whitespace-pre-wrap break-words">
                  {description ? linkifyText(description) : 'Нет описания'}
                </div>
                {user && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setIsEditingDesc(true)}
                  >
                    Изменить
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {tab === 'hw' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Оборудование</h2>
              {user && (
                <button
                  className="btn btn-sm btn-primary flex items-center gap-1"
                  onClick={openHWModal}
                >
                  <PlusIcon className="w-4 h-4" /> Добавить
                </button>
              )}
            </div>
            {hardware.length === 0 ? (
              <div className="text-center text-gray-500">
                Оборудование не найдено
              </div>
            ) : (
              <div className="space-y-2">
                {hardware.map((item) => (
                  <HardwareCard
                    key={item.id}
                    item={item}
                    onEdit={() => handleEditHW(item)}
                    onDelete={() => handleDeleteHW(item)}
                    user={user}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'tasks' && <TasksTab selected={selected} user={user} />}
        {tab === 'chat' && (
          <ChatTab selected={selected} userEmail={user?.email} />
        )}
      </div>
      <Dialog open={isHWModalOpen} onOpenChange={setIsHWModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHW ? 'Изменить оборудование' : 'Добавить оборудование'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleHWSubmit} className="space-y-2">
            <div>
              <input
                className="input input-bordered w-full"
                placeholder="Название"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            <div>
              <input
                className="input input-bordered w-full"
                placeholder="Расположение"
                {...register('location')}
              />
            </div>
            <div>
              <select
                className="select select-bordered w-full"
                {...register('purchase_status')}
              >
                <option value="не оплачен">не оплачен</option>
                <option value="оплачен">оплачен</option>
              </select>
              {errors.purchase_status && (
                <p className="text-red-500 text-sm">
                  {errors.purchase_status.message}
                </p>
              )}
            </div>
            <div>
              <select
                className="select select-bordered w-full"
                {...register('install_status')}
              >
                <option value="не установлен">не установлен</option>
                <option value="установлен">установлен</option>
              </select>
              {errors.install_status && (
                <p className="text-red-500 text-sm">
                  {errors.install_status.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <button type="button" className="btn" onClick={closeHWModal}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary">
                Сохранить
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

InventoryTabs.propTypes = {
  selected: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
  }),
  onUpdateSelected: PropTypes.func.isRequired,
  onTabChange: PropTypes.func,
}

export default InventoryTabs
