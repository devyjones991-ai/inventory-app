import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import usePersistedForm from '@/hooks/usePersistedForm'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import HardwareCard from './HardwareCard'
import ChatTab from './ChatTab'
import TasksTab from './TasksTab'
import { PlusIcon } from '@heroicons/react/24/outline'
import { linkifyText } from '@/utils/linkify'
import { useHardware } from '@/hooks/useHardware'
import { useObjects } from '@/hooks/useObjects'
import { useAuth } from '@/hooks/useAuth'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'

const HW_FORM_KEY = (objectId) => `hwForm_${objectId}`

function InventoryTabs({
  selected,
  onUpdateSelected,
  onTabChange = () => {},
  registerAddHandler,
}) {
  const { user } = useAuth()

  // --- вкладки и описание ---
  const [tab, setTab] = useState('desc')
  const [description, setDescription] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)

  // --- оборудование и счётчики ---
  const [hardware, setHardware] = useState([])
  const [tasksCount, setTasksCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)
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
    setValue,
    watch,
    formState: { errors },
  } = usePersistedForm(
    selected ? HW_FORM_KEY(selected.id) : null,
    defaultHWForm,
    isHWModalOpen,
    { resolver: zodResolver(hardwareSchema) },
  )

  useEffect(() => {
    register('purchase_status')
    register('install_status')
  }, [register])

  const purchaseStatus = watch('purchase_status')
  const installStatus = watch('install_status')

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
    reset({
      name: '',
      location: '',
      purchase_status: '�?�� �?���>���ؐ�?',
      install_status: "�?�� �?�?�'���?�?�?�>��?",
    })
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
    reset({
      name: '',
      location: '',
      purchase_status: '�?�� �?���>���ؐ�?',
      install_status: "�?�� �?�?�'���?�?�?�>��?",
    })
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
    try {
      await updateObject(selected.id, { description })
      onUpdateSelected({ ...selected, description })
    } finally {
      setIsEditingDesc(false)
    }
  }, [selected, description, updateObject, onUpdateSelected])

  useEffect(() => {
    onTabChange(tab)
  }, [tab, onTabChange])

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
      <TabsList className="mb-4">
        <TabsTrigger value="desc">Описание</TabsTrigger>
        <TabsTrigger value="hw">Железо ({hardware.length})</TabsTrigger>
        <TabsTrigger value="tasks">Задачи ({tasksCount})</TabsTrigger>
        <TabsTrigger value="chat">Чат ({messageCount})</TabsTrigger>
      </TabsList>

      <TabsContent value="desc" className="flex-1 overflow-auto">
        <div className="space-y-2">
          {isEditingDesc ? (
            <div className="space-y-2">
              <Textarea
                className="textarea textarea-bordered w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveDescription}>
                  Сохранить
                </Button>
                <Button size="sm" onClick={() => setIsEditingDesc(false)}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="whitespace-pre-wrap break-words">
                {description ? linkifyText(description) : 'Нет описания'}
              </div>
              {user && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingDesc(true)}
                >
                  Изменить
                </Button>
              )}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="hw" className="flex-1 overflow-auto">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Оборудование</h2>
            {user && (
              <Button
                size="sm"
                className="flex items-center gap-1"
                onClick={openHWModal}
              >
                <PlusIcon className="w-4 h-4" /> Добавить
              </Button>
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
      </TabsContent>

      <TabsContent value="tasks" className="flex-1 overflow-auto">
        <TasksTab
          selected={selected}
          registerAddHandler={registerAddHandler}
          onCountChange={setTasksCount}
        />
      </TabsContent>
      <TabsContent value="chat" className="flex-1 overflow-auto">
        <ChatTab
          selected={selected}
          userEmail={user?.email}
          onCountChange={setMessageCount}
        />
      </TabsContent>

      <Dialog open={isHWModalOpen} onOpenChange={setIsHWModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHW ? 'Изменить оборудование' : 'Добавить оборудование'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleHWSubmit} className="space-y-2">
            <div>
              <Input
                className="w-full"
                placeholder="Название"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Input
                className="w-full"
                placeholder="Расположение"
                {...register('location')}
              />
            </div>
            <div>
              <Select
                value={purchaseStatus}
                onValueChange={(value) => setValue('purchase_status', value)}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="не оплачен">не оплачен</SelectItem>
                  <SelectItem value="оплачен">оплачен</SelectItem>
                </SelectContent>
              </Select>
              {errors.purchase_status && (
                <p className="text-red-500 text-sm">
                  {errors.purchase_status.message}
                </p>
              )}
            </div>
            <div>
              <Select
                value={installStatus}
                onValueChange={(value) => setValue('install_status', value)}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="не установлен">не установлен</SelectItem>
                  <SelectItem value="установлен">установлен</SelectItem>
                </SelectContent>
              </Select>
              {errors.install_status && (
                <p className="text-red-500 text-sm">
                  {errors.install_status.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" onClick={closeHWModal}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Tabs>
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
  registerAddHandler: PropTypes.func,
}

export default InventoryTabs
