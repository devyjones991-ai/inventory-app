// src/components/InventoryTabs.jsx
import React, { useState, useEffect } from 'react'
import { supabase }         from '../supabaseClient'
import HardwareCard         from './HardwareCard'
import TaskCard             from './TaskCard'
import ChatTab              from './ChatTab'

export default function InventoryTabs({ selected, onUpdateSelected }) {
  const [tab, setTab] = useState('desc')
  const [description, setDescription] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)

  const [hardware, setHardware] = useState([])
  const [loadingHW, setLoadingHW] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({
    name: '',
    location: '',
    purchase_status: 'не оплачен',
    install_status:  'не установлен',
  })

  const [tasks, setTasks] = useState([])
  const [chats, setChats] = useState([])

  useEffect(() => {
    if (!selected) return
    setTab('desc')
    setDescription(selected.description || '')
    fetchHardware(selected.id)
    supabase.from('tasks').select('*').eq('object_id', selected.id)
      .then(({ data }) => setTasks(data || []))
    supabase.from('chat_messages').select('*').eq('object_id', selected.id)
      .then(({ data }) => setChats(data || []))
  }, [selected])

  async function fetchHardware(objectId) {
    setLoadingHW(true)
    const { data, error } = await supabase
      .from('hardware')
      .select('*')
      .eq('object_id', objectId)
      .order('created_at', { ascending: true })
    if (!error) setHardware(data)
    setLoadingHW(false)
  }

  async function saveDescription() {
    const { data, error } = await supabase
      .from('objects')
      .update({ description })
      .eq('id', selected.id)
      .select()
    if (!error) {
      onUpdateSelected({ ...selected, description: data[0].description })
      setIsEditingDesc(false)
    } else alert('Ошибка сохранения описания')
  }

  function openModal(item = null) {
    if (item) {
      setEditingItem(item)
      setForm({
        name: item.name,
        location: item.location,
        purchase_status: item.purchase_status,
        install_status:  item.install_status,
      })
    } else {
      setEditingItem(null)
      setForm({ name: '', location: '', purchase_status: 'не оплачен', install_status: 'не установлен' })
    }
    setIsModalOpen(true)
  }

  async function saveHardware() {
    try {
      const payload = {
        object_id:        selected.id,
        name:             form.name.trim(),
        location:         form.location.trim(),
        purchase_status:  form.purchase_status,
        install_status:   form.install_status,
      }
      let result
      if (editingItem) {
        result = await supabase
          .from('hardware')
          .update(payload)
          .eq('id', editingItem.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('hardware')
          .insert([payload])
          .select()
          .single()
      }
      if (result.error) throw result.error
      const rec = result.data
      setHardware(prev =>
        editingItem
          ? prev.map(h => (h.id === rec.id ? rec : h))
          : [...prev, rec]
      )
      setIsModalOpen(false)
    } catch (e) {
      alert('Ошибка сохранения оборудования: ' + e.message)
    }
  }

  async function deleteHardware(id) {
    if (!window.confirm('Удалить оборудование?')) return
    const { error } = await supabase
      .from('hardware')
      .delete()
      .eq('id', id)
    if (!error) setHardware(prev => prev.filter(h => h.id !== id))
    else alert('Ошибка удаления оборудования')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="tabs tabs-boxed">
        <button className={`tab ${tab==='desc'  ? 'tab-active' : ''}`} onClick={()=>setTab('desc')}>📝 Описание</button>
        <button className={`tab ${tab==='hw'    ? 'tab-active' : ''}`} onClick={()=>setTab('hw')}>🛠️ Железо ({hardware.length})</button>
        <button className={`tab ${tab==='tasks' ? 'tab-active' : ''}`} onClick={()=>setTab('tasks')}>✅ Задачи ({tasks.length})</button>
        <button className={`tab ${tab==='chats' ? 'tab-active' : ''}`} onClick={()=>setTab('chats')}>💬 Чаты ({chats.length})</button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab==='desc' && (
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{selected.name}</h3>
              {!isEditingDesc && <button className="btn btn-sm btn-outline" onClick={()=>setIsEditingDesc(true)}>Редактировать</button>}
            </div>
            {isEditingDesc ? (
              <div className="mt-4 space-y-2">
                <textarea className="textarea textarea-bordered w-full" rows={4} value={description} onChange={e=>setDescription(e.target.value)}/>
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

        {tab==='hw' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Оборудование</h3>
              <button className="btn btn-sm btn-primary" onClick={()=>openModal()}>➕ Добавить</button>
            </div>
            {loadingHW ? <p>Загрузка...</p> : (
              <div className="space-y-2">
                {hardware.map(item=>(
                  <HardwareCard key={item.id} item={item} onEdit={()=>openModal(item)} onDelete={()=>deleteHardware(item.id)}/>
                ))}
              </div>
            )}

            {isModalOpen && (
              <div className="modal modal-open">
                <div className="modal-box max-w-md relative">
                  <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={()=>setIsModalOpen(false)}>✕</button>
                  <h3 className="font-bold text-lg mb-4">{editingItem? 'Редактировать' : 'Добавить'} оборудование</h3>
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Название устройства</span></label>
                      <input type="text" className="input input-bordered w-full" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Местоположение</span></label>
                      <input type="text" className="input input-bordered w-full" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="form-control">
                        <label className="label"><span className="label-text">Статус покупки</span></label>
                        <select className="select select-bordered w-full" value={form.purchase_status} onChange={e=>setForm(f=>({...f,purchase_status:e.target.value}))}>
                          <option value="не оплачен">Не оплачен</option>
                          <option value="оплачен">Оплачен</option>
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Статус установки</span></label>
                        <select className="select select-bordered w-full" value={form.install_status} onChange={e=>setForm(f=>({...f,install_status:e.target.value}))}>
                          <option value="не установлен">Не установлен</option>
                          <option value="установлен">Установлен</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-action mt-4 flex space-x-2">
                    <button className="btn btn-primary" onClick={saveHardware}>Сохранить</button>
                    <button className="btn btn-ghost" onClick={()=>setIsModalOpen(false)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='tasks' && <div className="space-y-2">{tasks.map(t=><TaskCard key={t.id} item={t}/>)}</div>}
        {tab==='chats' && <ChatTab selected={selected} chats={chats}/>}  
      </div>
    </div>
  )
}
