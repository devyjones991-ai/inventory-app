import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import TaskCard from './TaskCard'
import Spinner from './Spinner'
import ErrorMessage from './ErrorMessage'
import ConfirmModal from './ConfirmModal'
import { useTasks } from '../hooks/useTasks'

const PAGE_SIZE = 20

function TasksTab({ selected, registerAddHandler }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    assignee: '',
    due_date: '',
    status: 'pending',
    notes: '',
  })
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [viewingTask, setViewingTask] = useState(null)
  const [taskDeleteId, setTaskDeleteId] = useState(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)

  const {
    tasks: hookTasks,
    loading: hookLoading,
    error: hookError,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    importTasks,
  } = useTasks(selected?.id)

  useEffect(() => {
    if (selected?.id) {
      loadTasks()
    }
  }, [selected?.id, loadTasks])

  useEffect(() => {
    setTasks(hookTasks)
    setLoading(hookLoading)
    setError(hookError)
  }, [hookTasks, hookLoading, hookError])

  const openTaskModal = useCallback(() => {
    setTaskForm({
      title: '',
      assignee: '',
      due_date: '',
      status: 'pending',
      notes: '',
    })
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }, [])

  useEffect(() => {
    registerAddHandler?.(openTaskModal)
  }, [registerAddHandler, openTaskModal])

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }, [])

  const openImportModal = useCallback(() => {
    setIsImportModalOpen(true)
  }, [])

  const closeImportModal = useCallback(() => {
    setIsImportModalOpen(false)
    setImportFile(null)
  }, [])

  const handleTaskSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      try {
        if (editingTask) {
          await updateTask(editingTask.id, taskForm)
        } else {
          await createTask(taskForm)
        }
        closeTaskModal()
      } catch (error) {
        console.error('Error saving task:', error)
      }
    },
    [taskForm, editingTask, createTask, updateTask, closeTaskModal],
  )

  const handleEditTask = useCallback((task) => {
    setTaskForm({
      title: task.title || '',
      assignee: task.assignee || '',
      due_date: task.due_date || '',
      status: task.status || 'pending',
      notes: task.notes || '',
    })
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }, [])

  const confirmDeleteTask = useCallback(async () => {
    if (taskDeleteId) {
      try {
        await deleteTask(taskDeleteId)
        setTaskDeleteId(null)
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }, [taskDeleteId, deleteTask])

  const handleImport = useCallback(async () => {
    if (importFile) {
      try {
        await importTasks(importFile)
        closeImportModal()
      } catch (error) {
        console.error('Import failed:', error)
      }
    }
  }, [importFile, importTasks, closeImportModal])

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('ru-RU')
  }

  if (!selected) {
    return (
      <div className="text-center py-8 text-gray-500">
        Выберите объект для просмотра задач
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Задачи для {selected.name}
        </h2>
        <div className="flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={openTaskModal}
          >
            Добавить задачу
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={openImportModal}
          >
            Импорт
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Нет задач для этого объекта.
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={(id) => setTaskDeleteId(id)}
              onView={setViewingTask}
            />
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto animate-fade-in">
            <button
              className="btn btn-circle absolute right-2 top-2 xs:btn-md md:btn-sm"
              onClick={closeTaskModal}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">
              {editingTask ? 'Редактировать задачу' : 'Новая задача'}
            </h3>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Название</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Исполнитель</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})}
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Дата выполнения</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Статус</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                >
                  <option value="pending">В ожидании</option>
                  <option value="in_progress">В процессе</option>
                  <option value="completed">Завершено</option>
                </select>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Заметки</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({...taskForm, notes: e.target.value})}
                />
              </div>
              <div className="modal-action flex space-x-2">
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Сохранить' : 'Добавить'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeTaskModal}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Task Modal */}
      {viewingTask && (
        <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto animate-fade-in">
            <button
              className="btn btn-circle absolute right-2 top-2 xs:btn-md md:btn-sm"
              onClick={() => setViewingTask(null)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">{viewingTask.title}</h3>
            <div className="space-y-2">
              {viewingTask.assignee && (
                <p>
                  <strong>Исполнитель:</strong> {viewingTask.assignee}
                </p>
              )}
              {viewingTask.due_date && (
                <p>
                  <strong>Дата:</strong> {formatDate(viewingTask.due_date)}
                </p>
              )}
              <p>
                <strong>Статус:</strong> {viewingTask.status}
              </p>
              {viewingTask.notes && (
                <p className="whitespace-pre-wrap break-words">
                  <strong>Заметки:</strong> {viewingTask.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!taskDeleteId}
        title="Удалить задачу?"
        onConfirm={confirmDeleteTask}
        onCancel={() => setTaskDeleteId(null)}
      />

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto animate-fade-in">
            <button
              className="btn btn-circle absolute right-2 top-2 xs:btn-md md:btn-sm"
              onClick={closeImportModal}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">Импорт задач</h3>
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
    </div>
  )
}

TasksTab.propTypes = {
  selected: PropTypes.object,
  registerAddHandler: PropTypes.func,
}

export default TasksTab