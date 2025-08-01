// src/components/InventoryTabs.jsx
import React, { useState, useEffect } from 'react'
import { supabase }         from '../supabaseClient'
import HardwareCard         from './HardwareCard'
import TaskCard             from './TaskCard'
import ChatTab              from './ChatTab'

export default function InventoryTabs({ selected, onUpdateSelected }) {
  // Общие вкладки и описание
  const [tab, setTab] = useState('desc')
  const [description, setDescription] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)

  // Оборудование (HW)
  const [hardware, setHardware] = useState([])
  const [loadingHW, setLoadingHW] = useState(false)
  const [isHWModalOpen, setIsHWModalOpen] = useState(false)
  const [editingHW, setEditingHW] = useState(null)
  const [hwForm, setHWForm] = useState({ name: '', location: '', purchase_status: 'не оплачен', install_status: 'не установлен' })

  // Задачи (Tasks)
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState({ title: '', status: 'open' })

  // Чаты (ChatTab)
  const [chats, setChats] = useState([])

  // Загрузка данных при смене объекта
  useEffect(() => {
    if (!selected) return
    // Описание
    setTab('desc')
    setDescription(selected.description || '')
    // Оборудование
    fetchHardware(selected.id)
    // Задачи
    fetchTasks(selected.id)
    // Чаты
    supabase.from('chat_messages').select('*').eq('object_id', selected.id)
      .then(({ data }) => setChats(data || []))
  }, [selected])

  // CRUD для описания
  async function saveDescription() {
    const { data, error } = await supabase
      .from('objects').update({ description }).eq('id', selected.id).select()
    if (!error) {
      onUpdateSelected({ ...selected, description: data[0].description })
      setIsEditingDesc(false)
    } else alert('Ошибка сохранения описания')
  }

  // CRUD для оборудования
  async function fetchHardware(objectId) {
    setLoadingHW(true)
    const { data, error } = await supabase.from('hardware').select('*').eq('object_id', objectId).order('created_at')
    if (!error) setHardware(data)
    setLoadingHW(false)
  }
  function openHWModal(item = null) {
    if (item) {
      setEditingHW(item)
      setHWForm({ name: item.name, location: item.location, purchase_status: item.purchase_status, install_status: item.install_status })
    } else {
      setEditingHW(null)
      setHWForm({ name: '', location: '', purchase_status: 'не оплачен', install_status: 'не установлен' })
    }
    setIsHWModalOpen(true)
  }
  async function saveHardware() {
    try {
      const payload = { object_id: selected.id, ...hwForm }
      let result
      if (editingHW) {
        result = await supabase.from('hardware').update(payload).eq('id', editingHW.id).select().single()
      } else {
        result = await supabase.from('hardware').insert([payload]).select().single()
      }
      if (result.error) throw result.error
      const rec = result.data
      setHardware(prev => editingHW ? prev.map(h=>h.id===rec.id?rec:h) : [...prev, rec])
      setIsHWModalOpen(false)
    } catch(e) { alert('Ошибка оборудования: '+e.message) }
  }
  async function deleteHardware(id) {
    if (!confirm('Удалить оборудование?')) return
    const { error } = await supabase.from('hardware').delete().eq('id', id)
    if (!error) setHardware(prev=>prev.filter(h=>h.id!==id))
    else alert('Ошибка удаления')
  }

  // CRUD для задач
  async function fetchTasks(objectId) {
    setLoadingTasks(true)
    const { data, error } = await supabase.from('tasks').select('*').eq('object_id', objectId).order('created_at')
    if (!error) setTasks(data)
    setLoadingTasks(false)
  }
  function openTaskModal(item = null) {
    if (item) {
      setEditingTask(item)
      setTaskForm({ title: item.title, status: item.status })
    } else {
      setEditingTask(null)
      setTaskForm({ title: '', status: 'open' })
    }
    setIsTaskModalOpen(true)
  }
  async function saveTask() {
    try {
      const payload = { object_id: selected.id, ...taskForm }
      let result
      if (editingTask) {
        result = await supabase.from('tasks').update(payload).eq('id', editingTask.id).select().single()
      } else {
        result = await supabase.from('tasks').insert([payload]).select().single()
      }
      if (result.error) throw result.error
      const rec = result.data
      setTasks(prev => editingTask ? prev.map(t=>t.id===rec.id?rec:t) : [...prev, rec])
      setIsTaskModalOpen(false)
    } catch(e) { alert('Ошибка задач: '+e.message) }
  }
  async function deleteTask(id) {
    if (!confirm('Удалить задачу?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks(prev=>prev.filter(t=>t.id!==id))
    else alert('Ошибка удаления')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Вкладки */}
      <div className="tabs tabs-boxed">
        <button className={`tab ${tab==='desc'? 'tab-active':''}`} onClick={()=>setTab('desc')}>📝 Описание</button>
        <button className={`tab ${tab==='hw'? 'tab-active':''}`} onClick={()=>setTab('hw')}>🛠 Железо ({hardware.length})</button>
        <button className={`tab ${tab==='tasks'? 'tab-active':''}`} onClick={()=>setTab('tasks')}>✅ Задачи ({tasks.length})</button>
        <button className={`tab ${tab==='chats'? 'tab-active':''}`} onClick={()=>setTab('chats')}>💬 Чат ({chats.length})</button>
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
              <div className="mt-4 space-y-2">
                <textarea className="textarea textarea-bordered w-full" rows={4} value={description} onChange={e=>setDescription(e.target.value)} />
                <div className="flex space-x-2">
                  <button className="btn btn-primary btn-sm" onClick={saveDescription}>Сохранить</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setIsEditingDesc(false)}>Отмена</button>
                </div>
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-line">{description||'Нет описания'}</p>
            )}
          </div>
        )}

        {/* Оборудование */}
        {tab==='hw' && (
          <div>
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-semibold">Оборудование</h3>
              <button className="btn btn-sm btn-primary" onClick={()=>openHWModal()}>➕ Добавить</button>
            </div>
            {loadingHW ? <p>Загрузка...</p> : (
              <div className="space-y-2">{hardware.map(h=><HardwareCard key={h.id} item={h} onEdit={()=>openHWModal(h)} onDelete={()=>deleteHardware(h.id)}/>)}</div>
            )}
            {isHWModalOpen && (
              <div className="modal modal-open"><div className="modal-box max-w-md relative">
                <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={()=>setIsHWModalOpen(false)}>✕</button>
                <h3 className="font-bold text-lg mb-4">{editingHW? 'Редактировать':'Добавить'} оборудование</h3>
                <div className="space-y-4">
                  {/* HW form fields... */}
                  {/* ... same as above ... */}
                </div>
                <div className="modal-action flex space-x-2">
                  <button className="btn btn-primary" onClick={saveHardware}>Сохранить</button>
                  <button className="btn btn-ghost" onClick={()=>setIsHWModalOpen(false)}>Отмена</button>
                </div>
              </div></div>
            )}
          </div>
        )}

        {/* Задачи */}
        {tab==='tasks' && (
          <div>
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-semibold">Задачи</h3>
              <button className="btn btn-sm btn-primary" onClick={()=>openTaskModal()}>➕ Добавить задачу</button>
            </div>
            {loadingTasks ? <p>Загрузка...</p> : (
              <div className="space-y-2">
                {tasks.map(t=>(
                  <TaskCard key={t.id} item={t}
                    onEdit={()=>openTaskModal(t)}
                    onDelete={()=>deleteTask(t.id)}
                  />
                ))}
              </div>
            )}

            {isTaskModalOpen && (
              <div className="modal modal-open"><div className="modal-box max-w-md relative">
                <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={()=>setIsTaskModalOpen(false)}>✕</button>
                <h3 className="font-bold text-lg mb-4">{editingTask? 'Редактировать':'Добавить'} задачу</h3>
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
                </div>
                <div className="modal-action flex space-x-2">
                  <button className="btn btn-primary" onClick={saveTask}>Сохранить</button>
                  <button className="btn btn-ghost" onClick={()=>setIsTaskModalOpen(false)}>Отмена</button>
                </div>
              </div></div>
            )}
          </div>
        )}

        {/* Чаты */}
        {tab==='chats' && <ChatTab selected={selected} chats={chats} />}
      </div>
    </div>
  )
}
