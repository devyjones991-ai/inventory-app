import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/supabaseClient'
import { handleSupabaseError } from '@/utils/handleSupabaseError'
import { useNavigate } from 'react-router-dom'
import logger from '@/utils/logger'

export function useTasks(objectId) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isSchemaCacheError = (err) =>
    err?.code === '42703' ||
    err?.message?.toLowerCase?.().includes('schema cache')

  const fetchTasks = useCallback(
    async (objId, offset = 0, limit = 20) => {
      try {
        if (!objId) return { data: [], error: null }
        const baseFields =
          'id, title, status, assignee, due_date, notes, created_at'
        const baseQuery = supabase
          .from('tasks')
          .select(baseFields)
          .eq('object_id', objId)
        // Load newest tasks first
        let result = await baseQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        if (isSchemaCacheError(result.error)) {
          result = await baseQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
        }
        if (result.error) throw result.error
        return result
      } catch (err) {
        logger.error('fetchTasks failed', err)
        await handleSupabaseError(err, navigate, 'Ошибка загрузки задач')
        return { data: null, error: err }
      }
    },
    [navigate],
  )

  const insertTask = useCallback(
    async (data) => {
      try {
        const baseFields =
          'id, title, status, assignee, due_date, notes, created_at'
        const {
          planned_date: _planned_date,
          plan_date: _plan_date,
          executor,
          assignee_id,
          assignee,
          title,
          status,
          due_date,
          notes,
          object_id,
        } = data
        const taskData = {
          title,
          status,
          due_date,
          notes,
          object_id,
          assignee: assignee ?? executor ?? assignee_id ?? null,
        }
        const result = await supabase
          .from('tasks')
          .insert([taskData])
          .select(baseFields)
          .single()
        if (result.error) throw result.error
        return result
      } catch (err) {
        await handleSupabaseError(err, navigate, 'Ошибка добавления задачи')
        return { data: null, error: err }
      }
    },
    [navigate],
  )

  const updateTaskInner = useCallback(
    async (id, data) => {
      try {
        const baseFields =
          'id, title, status, assignee, due_date, notes, created_at'
        const {
          planned_date: _planned_date,
          plan_date: _plan_date,
          executor,
          assignee_id,
          assignee,
          title,
          status,
          due_date,
          notes,
          object_id,
        } = data
        const taskData = {
          title,
          status,
          due_date,
          notes,
          object_id,
          assignee: assignee ?? executor ?? assignee_id ?? null,
        }
        const result = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', id)
          .select(baseFields)
          .single()
        if (result.error) throw result.error
        return result
      } catch (err) {
        await handleSupabaseError(err, navigate, 'Ошибка обновления задачи')
        return { data: null, error: err }
      }
    },
    [navigate],
  )

  const deleteTaskInner = useCallback(
    async (id) => {
      try {
        const result = await supabase.from('tasks').delete().eq('id', id)
        if (result.error) throw result.error
        return result
      } catch (err) {
        await handleSupabaseError(err, navigate, 'Ошибка удаления задачи')
        return { data: null, error: err }
      }
    },
    [navigate],
  )

  const loadTasks = useCallback(
    async ({ offset = 0, limit = 20 } = {}) => {
      setLoading(true)
      if (!objectId) {
        setTasks([])
        setError(null)
        setLoading(false)
        return { data: [], error: null }
      }
      const { data, error: err } = await fetchTasks(objectId, offset, limit)
      if (err) {
        setError(err.message || 'Ошибка загрузки задач')
        setTasks([])
      } else {
        setTasks(data || [])
        setError(null)
      }
      setLoading(false)
      return { data, error: err }
    },
    [objectId, fetchTasks],
  )

  const createTask = useCallback(
    async (data) => {
      const { data: newTask, error: err } = await insertTask(data)
      if (!err && newTask) {
        // Prepend to show immediately at the top (matches newest-first order)
        setTasks((prev) => [newTask, ...prev])
      }
      return { data: newTask, error: err }
    },
    [insertTask],
  )

  const updateTask = useCallback(
    async (id, data) => {
      const { data: updated, error: err } = await updateTaskInner(id, data)
      if (!err && updated) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      }
      return { data: updated, error: err }
    },
    [updateTaskInner],
  )

  const deleteTask = useCallback(
    async (id) => {
      const { data: del, error: err } = await deleteTaskInner(id)
      if (!err) {
        setTasks((prev) => prev.filter((t) => t.id !== id))
      }
      return { data: del, error: err }
    },
    [deleteTaskInner],
  )

  // Realtime updates for tasks of the selected object
  useEffect(() => {
    if (!objectId) return
    // Guard for tests or environments without realtime configured
    if (typeof supabase?.channel !== 'function') return

    const channel = supabase
      .channel(`tasks:${objectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `object_id=eq.${objectId}`,
        },
        (payload) => {
          const newTask = payload?.new
          if (!newTask) return
          setTasks((prev) => {
            // Skip if already present (e.g., after local create)
            const exists = prev.some((t) => t.id === newTask.id)
            if (exists) {
              return prev.map((t) => (t.id === newTask.id ? newTask : t))
            }
            return [newTask, ...prev]
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `object_id=eq.${objectId}`,
        },
        (payload) => {
          const updated = payload?.new
          if (!updated) return
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t)),
          )
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `object_id=eq.${objectId}`,
        },
        (payload) => {
          const old = payload?.old
          if (!old) return
          setTasks((prev) => prev.filter((t) => t.id !== old.id))
        },
      )

    channel.subscribe()

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
  }, [objectId])

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
  }
}
