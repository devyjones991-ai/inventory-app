import { supabase } from '../supabaseClient'

export function useTasks() {
  const fetchTasks = (objectId) =>
    supabase
      .from('tasks')
      .select(
        'id, title, status, assignee, assignee_id, executor, executor_id, due_date, planned_date, plan_date, notes',
      )
      .eq('object_id', objectId)
      .order('created_at')

  const insertTask = (data) =>
    supabase
      .from('tasks')
      .insert([data])
      .select(
        'id, title, status, assignee, assignee_id, executor, executor_id, due_date, planned_date, plan_date, notes',
      )
      .single()

  const updateTask = (id, data) =>
    supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select(
        'id, title, status, assignee, assignee_id, executor, executor_id, due_date, planned_date, plan_date, notes',
      )
      .single()

  const deleteTask = (id) => supabase.from('tasks').delete().eq('id', id)

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
