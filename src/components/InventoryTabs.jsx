import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import HardwareCard from './HardwareCard';
import TaskCard from './TaskCard';
import ChatTab from './ChatTab';
import { linkifyText } from '../utils/linkify';

export default function InventoryTabs({ selected, onUpdateSelected, user }) {
  // --- вкладки и описание ---
  const [tab, setTab] = useState('desc');
  const [description, setDescription] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // --- оборудование ---
  const [hardware, setHardware] = useState([]);
  const [loadingHW, setLoadingHW] = useState(false);
  const [isHWModalOpen, setIsHWModalOpen] = useState(false);
  const [editingHW, setEditingHW] = useState(null);
  const [hwForm, setHWForm] = useState({ name: '', location: '', purchase_status: 'не оплачен', install_status: 'не установлен' });

  // --- задачи ---
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', status: 'запланировано', assignee: '', due_date: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- чаты ---
  const [chats, setChats] = useState([]);

  // загрузка данных при смене объекта
  useEffect(() => {
    if (!selected) return;
    setTab('desc');
    setDescription(selected.description || '');
    fetchHardware(selected.id);
    fetchTasks(selected.id);
    supabase
      .from('chat_messages')
      .select('*')
      .eq('object_id', selected.id)
      .then(({ data }) => setChats(data || []));
  }, [selected]);

  // --- CRUD Описание ---
  async function saveDescription() {
    const { data, error } = await supabase
      .from('objects')
      .update({ description })
      .eq('id', selected.id)
      .select();
    if (!error) {
      onUpdateSelected({ ...selected, description: data[0].description });
      setIsEditingDesc(false);
    } else {
      alert('Ошибка сохранения описания');
    }
  }

  // --- CRUD Оборудование ---
  async function fetchHardware(objectId) {
    setLoadingHW(true);
    const { data, error } = await supabase
      .from('hardware')
      .select('*')
      .eq('object_id', objectId)
      .order('created_at');
    if (!error) setHardware(data);
    setLoadingHW(false);
  }

  function openHWModal(item = null) {
    if (item) {
      setEditingHW(item);
      setHWForm({
        name: item.name,
        location: item.location,
        purchase_status: item.purchase_status,
        install_status: item.install_status,
      });
    } else {
      setEditingHW(null);
      setHWForm({ name: '', location: '', purchase_status: 'не оплачен', install_status: 'не установлен' });
    }
    setIsHWModalOpen(true);
  }

  async function saveHardware() {
    const payload = { object_id: selected.id, ...hwForm };
    let res;
    if (editingHW) {
      res = await supabase.from('hardware').update(payload).eq('id', editingHW.id).select().single();
    } else {
      res = await supabase.from('hardware').insert([payload]).select().single();
    }
    if (res.error) return alert('Ошибка оборудования: ' + res.error.message);
    const rec = res.data;
    setHardware(prev => (editingHW ? prev.map(h => (h.id === rec.id ? rec : h)) : [...prev, rec]));
    setIsHWModalOpen(false);
  }

  async function deleteHardware(id) {
    if (!window.confirm('Удалить оборудование?')) return;
    const { error } = await supabase.from('hardware').delete().eq('id', id);
    if (error) return alert('Ошибка удаления');
    setHardware(prev => prev.filter(h => h.id !== id));
  }

  // --- CRUD Задачи ---
  async function fetchTasks(objectId) {
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('object_id', objectId)
      .order('created_at');
    if (!error) setTasks(data);
    setLoadingTasks(false);
  }

  function openTaskModal(item = null) {
    if (item) {
      setEditingTask(item);
      setTaskForm({
        title: item.title,
        status: item.status,
        assignee: item.assignee || item.executor || '',
        due_date: item.due_date || item.planned_date || item.plan_date || '',
      });
    } else {
      setEditingTask(null);
      setTaskForm({ title: '', status: 'запланировано', assignee: '', due_date: '' });
    }
    setShowDatePicker(false);
    setIsTaskModalOpen(true);
  }

  async function saveTask() {
    const base = { title: taskForm.title, status: taskForm.status };
    if (taskForm.due_date) {
      base.due_date = taskForm.due_date;
      base.planned_date = taskForm.due_date;
      base.plan_date = taskForm.due_date;
    }
    if (taskForm.assignee) {
      base.assignee = taskForm.assignee;
      base.executor = taskForm.assignee;
    }
    let payload = { object_id: selected.id, ...base };

    let res;
    if (editingTask) {
      res = await supabase.from('tasks').update(payload).eq('id', editingTask.id).select().single();
    } else {
      res = await supabase.from('tasks').insert([payload]).select().single();
    }

    if (res.error && /(assignee|executor|due_date|planned_date|plan_date)/.test(res.error.message)) {
      const { assignee, executor, due_date, planned_date, plan_date, ...baseWithout } = payload;
      if (editingTask) {
        res = await supabase.from('tasks').update(baseWithout).eq('id', editingTask.id).select().single();
      } else {
        res = await supabase.from('tasks').insert([baseWithout]).select().single();
      }
    }

    if (res.error) return alert('Ошибка задач: ' + res.error.message);
    const rec = res.data;
    setTasks(prev => (editingTask ? prev.map(t => (t.id === rec.id ? rec : t)) : [...prev, rec]));
    setIsTaskModalOpen(false);
  }

  async function deleteTask(id) {
    if (!window.confirm('Удалить задачу?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) return alert('Ошибка удаления');
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Вкладки */}
      <div className="tabs tabs-boxed">
        <button className={`tab ${tab === 'desc' ? 'tab-active' : ''}`} onClick={() => setTab('desc')}>📝 Описание</button>
        <button className={`tab ${tab === 'hw' ? 'tab-active' : ''}`} onClick={() => setTab('hw')}>🛠 Железо ({hardware.length})</button>
        <button className={`tab ${tab === 'tasks' ? 'tab-active' : ''}`} onClick={() => setTab('tasks')}>✅ Задачи ({tasks.length})</button>
        <button className={`tab ${tab === 'chats' ? 'tab-active' : ''}`} onClick={() => setTab('chats')}>💬 Чаты ({chats.length})</button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Описание */}
        {tab === 'desc' && (
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{selected.name}</h3>
              {!isEditingDesc && <button className="btn btn-sm btn-outline" onClick={() => setIsEditingDesc(true)}>Редактировать</button>}
            </div>
            {isEditingDesc ? (
              <>
