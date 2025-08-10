import { supabase } from '../supabaseClient'

export function useTasks() {
  const fetchTasks = (objectId) =>
    supabase
      .from('tasks')
      .select('*')
      .eq('object_id', objectId)
      .order('created_at')

  const insertTask = (data) =>
    supabase.from('tasks').insert([data]).select().single()

  const updateTask = (id, data) =>
    supabase.from('tasks').update(data).eq('id', id).select().single()

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
