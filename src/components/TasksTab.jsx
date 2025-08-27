import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import TaskCard from './TaskCard'
import ErrorMessage from './ErrorMessage'
import ConfirmModal from './ConfirmModal'
import { useTasks } from '@/hooks/useTasks'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
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

const PAGE_SIZE = 20

function TasksTab({ selected, registerAddHandler, onCountChange }) {
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

  const {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks(selected?.id)

  useEffect(() => {
    if (selected?.id) {
      loadTasks({ limit: PAGE_SIZE })
    }
  }, [selected?.id, loadTasks])

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

  useEffect(() => {
    onCountChange?.(tasks.length)
  }, [tasks, onCountChange])

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }, [])

  const handleTaskSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      const payload = { ...taskForm, object_id: selected?.id }
      try {
        if (editingTask) {
          await updateTask(editingTask.id, payload)
        } else {
          await createTask(payload)
        }
        closeTaskModal()
      } catch (err) {
        console.error('Error saving task:', err)
      }
    },
    [
      taskForm,
      editingTask,
      selected?.id,
      createTask,
      updateTask,
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
      } catch (err) {
        console.error('Error deleting task:', err)
      }
    }
  }, [taskDeleteId, deleteTask])

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('ru-RU') : ''

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
        <div className="flex gap-2">
          <Button size="sm" onClick={openTaskModal}>
            Добавить задачу
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Нет задач для этого объекта.
        </div>
      ) : (
        <div className="space-y-3">
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

      {/* Task Modal */}
      <Dialog
        open={isTaskModalOpen}
        onOpenChange={(open) => !open && closeTaskModal()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Редактировать задачу' : 'Новая задача'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Название *</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Исполнитель</Label>
              <Input
                id="task-assignee"
                value={taskForm.assignee}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, assignee: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={taskForm.status}
                onValueChange={(value) =>
                  setTaskForm({ ...taskForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="запланировано">запланировано</SelectItem>
                  <SelectItem value="в работе">в работе</SelectItem>
                  <SelectItem value="выполнено">выполнено</SelectItem>
                  <SelectItem value="отменено">отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-notes">Заметки</Label>
              <Textarea
                id="task-notes"
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

      {/* View Task Modal */}
      <Dialog
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
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
    </div>
  )
}

TasksTab.propTypes = {
  selected: PropTypes.object,
  registerAddHandler: PropTypes.func,
  onCountChange: PropTypes.func,
}

export default TasksTab
