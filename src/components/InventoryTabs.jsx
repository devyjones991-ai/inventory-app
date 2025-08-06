import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import HardwareCard from './HardwareCard';
import TaskCard from './TaskCard';
import ChatTab from './ChatTab';
import { PlusIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import { linkifyText } from '../utils/linkify';
import { toast } from 'react-hot-toast';
import { pushNotification } from '../utils/notifications';

const TAB_KEY = objectId => `tab_${objectId}`;
const HW_MODAL_KEY = objectId => `hwModal_${objectId}`;
const HW_FORM_KEY = objectId => `hwForm_${objectId}`;
const TASK_MODAL_KEY = objectId => `taskModal_${objectId}`;
const TASK_FORM_KEY = objectId => `taskForm_${objectId}`;

// форматирование даты для отображения в русской локали
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  } catch {
    return dateStr;
  }
}

export default function InventoryTabs({ selected, onUpdateSelected, user }) {
  // --- вкладки и описание ---
  const [tab, setTab] = useState('desc')
  const [description, setDescription] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)

  // --- оборудование ---
  const [hardware, setHardware]         = useState([])
  const [loadingHW, setLoadingHW]       = useState(false)
  const [isHWModalOpen, setIsHWModalOpen] = useState(false)
  const [editingHW, setEditingHW]       = useState(null)
  const defaultHWForm = { name: '', location: '', purchase_status: 'не оплачен', install_status: 'не установлен' }
  const [hwForm, setHWForm]             = useState(defaultHWForm)

  // --- задачи ---
  const [tasks, setTasks]               = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask]   = useState(null)
  const defaultTaskForm = { title: '', status: 'запланировано', assignee: '', due_date: '', notes: '' }
  const [taskForm, setTaskForm]         = useState(defaultTaskForm)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [viewingTask, setViewingTask]   = useState(null)

  // --- чат ---
  const [chatMessages, setChatMessages] = useState([])

  // загрузка данных при смене объекта и восстановление состояния UI
  useEffect(() => {
    if (!selected) return
    const savedTab = typeof localStorage !== 'undefined' ? localStorage.getItem(TAB_KEY(selected.id)) : null
    setTab(savedTab || 'desc')
    const savedHWForm = typeof localStorage !== 'undefined' ? localStorage.getItem(HW_FORM_KEY(selected.id)) : null
    const savedHWOpen = typeof localStorage !== 'undefined' ? localStorage.getItem(HW_MODAL_KEY(selected.id)) === 'true' : false
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
    setHWForm(parsedHWForm)
    setIsHWModalOpen(savedHWOpen)
    const savedTaskForm = typeof localStorage !== 'undefined' ? localStorage.getItem(TASK_FORM_KEY(selected.id)) : null
    const savedTaskOpen = typeof localStorage !== 'undefined' ? localStorage.getItem(TASK_MODAL_KEY(selected.id)) === 'true' : false
    let parsedTaskForm = defaultTaskForm
    if (savedTaskForm) {
      try {
        parsedTaskForm = JSON.parse(savedTaskForm)
      } catch {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(TASK_FORM_KEY(selected.id))
        }
      }
    }
    setTaskForm(parsedTaskForm)
    setIsTaskModalOpen(savedTaskOpen)
    setDescription(selected.description || '')
    fetchHardware(selected.id)
    fetchTasks(selected.id)
    supabase.from('chat_messages').select('*').eq('object_id', selected.id)
      .then(({ data }) => setChatMessages(data || []))
  }, [selected])

  useEffect(() => {
    if (!selected) return
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TAB_KEY(selected.id), tab)
    }
  }, [tab, selected])

  useEffect(() => {
    if (!selected) return
    if (typeof localStorage !== 'undefined') {
      if (!isHWModalOpen) {
        localStorage.removeItem(HW_FORM_KEY(selected.id))
      } else {
        localStorage.setItem(HW_FORM_KEY(selected.id), JSON.stringify(hwForm))
      }
      localStorage.setItem(HW_MODAL_KEY(selected.id), isHWModalOpen)
    }
  }, [isHWModalOpen, hwForm, selected])

  useEffect(() => {
    if (!selected) return
    if (typeof localStorage !== 'undefined') {
      if (!isTaskModalOpen) {
        localStorage.removeItem(TASK_FORM_KEY(selected.id))
      } else {
        localStorage.setItem(TASK_FORM_KEY(selected.id), JSON.stringify(taskForm))
      }
      localStorage.setItem(TASK_MODAL_KEY(selected.id), isTaskModalOpen)
    }
  }, [isTaskModalOpen, taskForm, selected])

  // realtime уведомления по задачам и чату
  useEffect(() => {
    if (!selected) return
    const taskChannel = supabase
      .channel(`tasks_object_${selected.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks',
        filter: `object_id=eq.${selected.id}`
      }, payload => {
        setTasks(prev => {
          if (prev.some(t => t.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        if (tab !== 'tasks') {
          toast.success(`Добавлена задача: ${payload.new.title}`)
          pushNotification('Новая задача', payload.new.title)
        }
      })
      .subscribe()

    const chatChannel = supabase
      .channel(`chat_messages_object_${selected.id}_tabs`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `object_id=eq.${selected.id}`
      }, payload => {
        setChatMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        const sender = user.user_metadata?.username || user.email
        if (tab !== 'chat' && payload.new.sender !== sender) {
          toast.success('Новое сообщение в чате')
          const body = payload.new.content || '📎 Файл'
          pushNotification('Новое сообщение', `${payload.new.sender}: ${body}`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(taskChannel)
      supabase.removeChannel(chatChannel)
    }
  }, [selected, tab, user])

  // --- CRUD Описание ---
  async function saveDescription() {
    const { data, error } = await supabase
      .from('objects').update({ description }).eq('id', selected.id).select()
    if (!error) {
      onUpdateSelected({ ...selected, description: data[0].description })
      setIsEditingDesc(false)
    } else alert('Ошибка сохранения описания')
  }

  // --- CRUD Оборудование ---
  async function fetchHardware(objectId) {
    setLoadingHW(true)
    const { data, error } = await supabase
      .from('hardware').select('*').eq('object_id', objectId).order('created_at')
    if (!error) setHardware(data)
    setLoadingHW(false)
  }
  function openHWModal(item = null) {
    if (item) {
      setEditingHW(item)
      setHWForm({
        name: item.name,
        location: item.location,
        purchase_status: item.purchase_status,
        install_status: item.install_status
      })
    } else {
      setEditingHW(null)
      setHWForm({ ...defaultHWForm })
    }
    setIsHWModalOpen(true)
  }
  async function saveHardware() {
    const payload = { object_id: selected.id, ...hwForm }
    let res
    if (editingHW) {
      res = await supabase.from('hardware').update(payload).eq('id', editingHW.id).select().single()
    } else {
      res = await supabase.from('hardware').insert([payload]).select().single()
    }
    if (res.error) return alert('Ошибка оборудования: ' + res.error.message)
    const rec = res.data
    setHardware(prev => editingHW ? prev.map(h => h.id === rec.id ? rec : h) : [...prev, rec])
    setIsHWModalOpen(false)
    setEditingHW(null)
    setHWForm({ ...defaultHWForm })
  }
  async function deleteHardware(id) {
    if (!confirm('Удалить оборудование?')) return
    const { error } = await supabase.from('hardware').delete().eq('id', id)
    if (error) return alert('Ошибка удаления')
    setHardware(prev => prev.filter(h => h.id !== id))
  }

  // --- CRUD Задачи ---
  async function fetchTasks(objectId) {
    setLoadingTasks(true)
    const { data, error } = await supabase
      .from('tasks').select('*').eq('object_id', objectId).order('created_at')
    if (!error) {
      setTasks(data || [])
    }
    setLoadingTasks(false)
  }
  function openTaskModal(item = null) {
    if (item) {
      setEditingTask(item)
      setTaskForm({
        title: item.title,
        status: item.status,
        assignee: item.assignee || item.executor || '',
        due_date: item.due_date || item.planned_date || item.plan_date || '',
        notes: item.notes || ''
      })
    } else {
      setEditingTask(null)
      setTaskForm({ ...defaultTaskForm })
    }
    setShowDatePicker(false)
    setIsTaskModalOpen(true)
  }

  function openTaskView(item) {
    setViewingTask(item)
  }
  async function saveTask() {
    const payload = {
      object_id: selected.id,
      title: taskForm.title,
      status: taskForm.status,
      assignee: taskForm.assignee || null,
      executor: taskForm.assignee || null,
      due_date: taskForm.due_date || null,
      planned_date: taskForm.due_date || null,
      plan_date: taskForm.due_date || null,
      notes: taskForm.notes || null
    }
    let res
    if (editingTask) {
      res = await supabase.from('tasks').update(payload).eq('id', editingTask.id).select().single()
    } else {
      res = await supabase.from('tasks').insert([payload]).select().single()
    }
    if (res.error) return alert('Ошибка задач: ' + res.error.message)
    const rec = res.data
    setTasks(prev =>
      editingTask
        ? prev.map(t => (t.id === rec.id ? rec : t))
        : [...prev, rec]
    )
    setIsTaskModalOpen(false)
    setEditingTask(null)
    setTaskForm({ ...defaultTaskForm })
    toast.success('Задача сохранена')
  }
  async function deleteTask(id) {
    if (!confirm('Удалить задачу?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) return alert('Ошибка удаления')
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Вкладки */}
      <div className="flex mb-4 border-b">
        <button
          className={`px-4 py-2 hover:bg-primary/10 ${tab==='desc' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setTab('desc')}
        >
          Описание
        </button>
        <button
          className={`px-4 py-2 hover:bg-primary/10 ${tab==='hw' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setTab('hw')}
        >
          Железо ({hardware.length})
        </button>
        <button
          className={`px-4 py-2 hover:bg-primary/10 ${tab==='tasks' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setTab('tasks')}
        >
          Задачи ({tasks.length})
        </button>
        <button
          className={`px-4 py-2 hover:bg-primary/10 flex items-center gap-1 ${tab==='chat' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setTab('chat')}
        >
          <ChatBubbleOvalLeftIcon className="w-4 h-4" /> Чат ({chatMessages.length})
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Описание */}
        {tab==='desc' && (
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{selected.name}</h3>
              {!isEditingDesc && <button className="btn btn-sm btn-outline" onClick={()=>setIsEditingDesc(true)}>Редактировать</button>}
            </div>
            {isEditingDesc ? (
              <>
                <textarea className="textarea textarea-bordered w-full mt-4" rows={4} value={description} onChange={e=>setDescription(e.target.value)} />
                <div className="mt-2 flex space-x-2">
                  <button className="btn btn-primary btn-sm" onClick={saveDescription}>Сохранить</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setIsEditingDesc(false)}>Отмена</button>
                </div>
              </>
            ) : (
              description ? (
                <p className="mt-2 whitespace-pre-wrap break-all">
                  {linkifyText(description)}
                </p>
              ) : (
                <p className="mt-2">Нет описания</p>
              )
            )}
          </div>
        )}

        {/* Оборудование */}
        {tab==='hw' && (
          <div>
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-semibold">Оборудование</h3>
              <button className="btn btn-sm btn-primary flex items-center gap-1" onClick={() => openHWModal()}>
                <PlusIcon className="w-4 h-4" /> Добавить
              </button>
            </div>
            {loadingHW ? <p>Загрузка...</p> : (
              <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {hardware.map(h => (
                  <HardwareCard key={h.id} item={h} onEdit={() => openHWModal(h)} onDelete={() => deleteHardware(h.id)} />
                ))}
              </div>
            )}

            {isHWModalOpen && (
              <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="modal-box relative w-full max-w-md animate-fade-in">
                  <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={()=>setIsHWModalOpen(false)}>✕</button>
                  <h3 className="font-bold text-lg mb-4">{editingHW ? 'Редактировать' : 'Добавить'} оборудование</h3>

                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Название устройства</span></label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Например, keenetic giga"
                        value={hwForm.name}
                        onChange={e=>setHWForm(f=>({...f,name:e.target.value}))}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Местоположение</span></label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Где стоит"
                        value={hwForm.location}
                        onChange={e=>setHWForm(f=>({...f,location:e.target.value}))}
                      />
                    </div>
                    <div className="flex space-x-4">
                      <div className="form-control flex-1">
                        <label className="label"><span className="label-text">Статус покупки</span></label>
                        <select
                          className="select select-bordered w-full"
                          value={hwForm.purchase_status}
                          onChange={e=>setHWForm(f=>({...f,purchase_status:e.target.value}))}
                        >
                          <option value="не оплачен">Не оплачен</option>
                          <option value="оплачен">Оплачен</option>
                        </select>
                      </div>
                      <div className="form-control flex-1">
                        <label className="label"><span className="label-text">Статус установки</span></label>
                        <select
                          className="select select-bordered w-full"
                          value={hwForm.install_status}
                          onChange={e=>setHWForm(f=>({...f,install_status:e.target.value}))}
                        >
                          <option value="не установлен">Не установлен</option>
                          <option value="установлен">Установлен</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="modal-action flex space-x-2">
                    <button className="btn btn-primary" onClick={saveHardware}>Сохранить</button>
                    <button className="btn btn-ghost" onClick={()=>setIsHWModalOpen(false)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Задачи */}
        {tab==='tasks' && (
          <div>
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-semibold">Задачи</h3>
              <button className="btn btn-sm btn-primary flex items-center gap-1" onClick={() => openTaskModal()}>
                <PlusIcon className="w-4 h-4" /> Добавить задачу
              </button>
            </div>
            {loadingTasks ? <p>Загрузка...</p> : (
              <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map(t => (
                  <TaskCard
                    key={t.id}
                    item={t}
                    onView={() => openTaskView(t)}
                    onEdit={() => openTaskModal(t)}
                    onDelete={() => deleteTask(t.id)}
                  />
                ))}
              </div>
            )}

            {isTaskModalOpen && (
              <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="modal-box relative w-full max-w-md animate-fade-in">
                  <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={()=>setIsTaskModalOpen(false)}>✕</button>
                  <h3 className="font-bold text-lg mb-4">{editingTask ? 'Редактировать' : 'Добавить'} задачу</h3>
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Заголовок задачи</span></label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={taskForm.title}
                        onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Исполнитель</span></label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={taskForm.assignee}
                        onChange={e=>setTaskForm(f=>({...f,assignee:e.target.value}))}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label flex items-center"><span className="label-text">Дата</span>
                        <button type="button" className="ml-2 btn btn-ghost btn-xs" onClick={()=>setShowDatePicker(s=>!s)}>📅</button>
                      </label>
                      {showDatePicker && (
                        <input
                          type="date"
                          className="input input-bordered w-full"
                          value={taskForm.due_date}
                          onChange={e=>setTaskForm(f=>({...f,due_date:e.target.value}))}
                        />
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Статус</span></label>
                      <select
                        className="select select-bordered w-full"
                        value={taskForm.status}
                        onChange={e=>setTaskForm(f=>({...f,status:e.target.value}))}
                      >
                        <option value="запланировано">Запланировано</option>
                        <option value="в процессе">В процессе</option>
                        <option value="завершено">Завершено</option>
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Заметки</span></label>
                      <textarea
                        className="textarea textarea-bordered w-full"
                        rows={3}
                        value={taskForm.notes}
                        onChange={e=>setTaskForm(f=>({...f,notes:e.target.value}))}
                      />
                    </div>
                  </div>
                  <div className="modal-action flex space-x-2">
                    <button className="btn btn-primary" onClick={saveTask}>Сохранить</button>
                    <button className="btn btn-ghost" onClick={()=>setIsTaskModalOpen(false)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}

            {viewingTask && (
              <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="modal-box relative w-full max-w-md animate-fade-in">
                  <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={()=>setViewingTask(null)}>✕</button>
                  <h3 className="font-bold text-lg mb-4">{viewingTask.title}</h3>
                  <div className="space-y-2">
                    {(viewingTask.assignee || viewingTask.executor) && (
                      <p><strong>Исполнитель:</strong> {viewingTask.assignee || viewingTask.executor}</p>
                    )}
                    {(viewingTask.due_date || viewingTask.planned_date || viewingTask.plan_date) && (
                      <p><strong>Дата:</strong> {formatDate(viewingTask.due_date || viewingTask.planned_date || viewingTask.plan_date)}</p>
                    )}
                    <p><strong>Статус:</strong> {viewingTask.status}</p>
                    {viewingTask.notes && (
                      <p className="whitespace-pre-wrap break-words"><strong>Заметки:</strong> {viewingTask.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Чат */}
        {tab==='chat' && <ChatTab selected={selected} user={user} />}
      </div>
    </div>
  )
}
