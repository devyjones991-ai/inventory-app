import { supabase } from '../supabaseClient'
import { handleSupabaseError } from '../utils/handleSupabaseError'
import { useNavigate } from 'react-router-dom'
import logger from '../utils/logger'

export function useTasks() {
  const navigate = useNavigate()

  const isSchemaCacheError = (error) =>
    error?.code === '42703' ||
    error?.message?.toLowerCase?.().includes('schema cache')

  const fetchTasks = async (objectId, offset = 0, limit = 20) => {
    try {
      const baseFields =
        'id, title, status, assignee, assignee_id, due_date, notes, created_at'
      const baseQuery = supabase
        .from('tasks')
        .select(baseFields)
        .eq('object_id', objectId)
      let result = await baseQuery
        .order('created_at')
        .range(offset, offset + limit - 1)
      if (isSchemaCacheError(result.error)) {
        result = await baseQuery
          .order('created_at')
          .range(offset, offset + limit - 1)
      }
      if (result.error) throw result.error
      return result
    } catch (error) {
      logger.error('fetchTasks failed', error)
      await handleSupabaseError(error, navigate, 'Ошибка загрузки задач')
      return { data: null, error }
    }
  }

  const insertTask = async (data) => {
    try {
      const baseFields =
        'id, title, status, assignee, assignee_id, due_date, notes, created_at'
      const {
        planned_date: _planned_date,
        plan_date: _plan_date,
        ...taskData
      } = data
      const result = await supabase
        .from('tasks')
        .insert([taskData])
        .select(baseFields)
        .single()
      if (result.error) throw result.error
      return result
    } catch (error) {
      await handleSupabaseError(error, navigate, 'Ошибка добавления задачи')
      return { data: null, error }
    }
  }

  const updateTask = async (id, data) => {
    try {
      const baseFields =
        'id, title, status, assignee, assignee_id, due_date, notes, created_at'
      const {
        planned_date: _planned_date,
        plan_date: _plan_date,
        ...taskData
      } = data
      const result = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', id)
        .select(baseFields)
        .single()
      if (result.error) throw result.error
      return result
    } catch (error) {
      await handleSupabaseError(error, navigate, 'Ошибка обновления задачи')
      return { data: null, error }
    }
  }

  const deleteTask = async (id) => {
    try {
      const result = await supabase.from('tasks').delete().eq('id', id)
      if (result.error) throw result.error
      return result
    } catch (error) {
      await handleSupabaseError(error, navigate, 'Ошибка удаления задачи')
      return { data: null, error }
    }
  }

  const subscribeToTasks = (objectId, handler) => {
    const channel = supabase
      .channel(`tasks_object_${objectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `object_id=eq.${objectId}`,
        },
        handler,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `object_id=eq.${objectId}`,
        },
        handler,
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `object_id=eq.${objectId}`,
        },
        handler,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  const subscribeToAllTasks = (handler) => {
    const channel = supabase
      .channel('tasks_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        handler,
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        handler,
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        handler,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  return {
    fetchTasks,
    insertTask,
    updateTask,
    deleteTask,
    subscribeToTasks,
    subscribeToAllTasks,
  }
}
