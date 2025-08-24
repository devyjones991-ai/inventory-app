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