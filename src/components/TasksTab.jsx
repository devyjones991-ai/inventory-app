import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import TaskCard from './TaskCard'
import ErrorMessage from './ErrorMessage'
import ConfirmModal from './ConfirmModal'
import { useTasks } from '../hooks/useTasks'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

function TasksTab({ selected, registerAddHandler }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    assignee: '',
    due_date: '',
    status: 'запланировано',
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
      status: 'запланировано',
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
        const payload = { ...taskForm, object_id: selected?.id }
        if (editingTask) {
          await updateTask(editingTask.id, payload)
        } else {
          await createTask(payload)
        }
        closeTaskModal()
      } catch (error) {
        console.error('Error saving task:', error)
      }
    },
    [
      taskForm,
      editingTask,
      createTask,
      updateTask,
      selected?.id,
      closeTaskModal,
    ],
  )

  const handleEditTask = useCallback((task) => {
    setTaskForm({
      title: task.title || '',
      assignee: task.assignee || '',
      due_date: task.due_date || '',
      status: task.status || 'запланировано',
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
      <div className="space-y-2">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
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
        <div className="space-x-2">
          <Button onClick={openTaskModal}>Добавить задачу</Button>
          <Button variant="outline" onClick={openImportModal}>
            Импорт
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center text-gray-500">
          Нет задач для этого объекта.
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              item={task}
              onEdit={() => handleEditTask(task)}
              onDelete={() => setTaskDeleteId(task.id)}
              onView={() => setViewingTask(task)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={isTaskModalOpen}
        onOpenChange={(open) => {
          if (!open) closeTaskModal()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Редактировать задачу' : 'Новая задача'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div>
              <Label htmlFor="task-title">Название</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="task-assignee">Исполнитель</Label>
              <Input
                id="task-assignee"
                value={taskForm.assignee}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, assignee: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="task-due-date">Дата выполнения</Label>
              <Input
                id="task-due-date"
                type="date"
                value={taskForm.due_date}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, due_date: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Статус</Label>
              <Select
                value={taskForm.status}
                onValueChange={(value) =>
                  setTaskForm({ ...taskForm, status: value })
                }
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="запланировано">В ожидании</SelectItem>
                  <SelectItem value="в работе">В работе</SelectItem>
                  <SelectItem value="завершено">Выполнено</SelectItem>
                  <SelectItem value="отменено">Отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Заметки</Label>
              <Textarea
                rows={3}
                value={taskForm.notes}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, notes: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingTask ? 'Сохранить' : 'Добавить'}
              </Button>
              <Button type="button" variant="ghost" onClick={closeTaskModal}>
                Отмена
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewingTask}
        onOpenChange={(open) => {
          if (!open) setViewingTask(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {viewingTask?.assignee && (
              <p>
                <strong>Исполнитель:</strong> {viewingTask.assignee}
              </p>
            )}
            {viewingTask?.due_date && (
              <p>
                <strong>Дата:</strong> {formatDate(viewingTask.due_date)}
              </p>
            )}
            <p>
              <strong>Статус:</strong> {viewingTask?.status}
            </p>
            {viewingTask?.notes && (
              <p className="whitespace-pre-wrap break-words">
                <strong>Заметки:</strong> {viewingTask.notes}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!taskDeleteId}
        title="Удалить задачу?"
        onConfirm={confirmDeleteTask}
        onCancel={() => setTaskDeleteId(null)}
      />

      <Dialog
        open={isImportModalOpen}
        onOpenChange={(open) => {
          if (!open) closeImportModal()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Импорт задач</DialogTitle>
          </DialogHeader>
          <Input
            type="file"
            className="file-input file-input-bordered w-full"
            onChange={(e) => setImportFile(e.target.files[0])}
          />
          <DialogFooter>
            <Button onClick={handleImport}>Загрузить</Button>
            <Button variant="ghost" onClick={closeImportModal}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

TasksTab.propTypes = {
  selected: PropTypes.object,
  registerAddHandler: PropTypes.func,
}

export default TasksTab
