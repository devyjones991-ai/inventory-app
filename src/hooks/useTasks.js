import { supabase } from '../supabaseClient'
import { handleSupabaseError } from '../utils/handleSupabaseError'
import { useNavigate } from 'react-router-dom'

export function useTasks() {
  const navigate = useNavigate()

  const fetchTasks = async (objectId) => {
    try {
      const result = await supabase
        .from('tasks')
        .select(
          'id, title, status, assignee, assignee_id, executor, executor_id, due_date, planned_date, plan_date, notes',
        )
        .eq('object_id', objectId)
        .order('created_at')
      if (result.error) throw result.error
      return result
    } catch (error) {
      await handleSupabaseError(error, navigate, 'Ошибка загрузки задач')
      return { data: null, error }
    }
  }

  const insertTask = async (data) => {
    try {
      const result = await supabase
        .from('tasks')
        .insert([data])
        .select(
          'id, title, status, assignee, assignee_id, executor, executor_id, due_date, planned_date, plan_date, notes',
        )
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
      const result = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .select(
          'id, title, status, assignee, assignee_id, executor, executor_id, due_date, planned_date, plan_date, notes',
        )
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
