import { supabase } from '../supabaseClient'

export function useObjects() {
  const fetchObjects = () =>
    supabase
      .from('objects')
      .select('id, name, description')
      .order('created_at', { ascending: true })

  const insertObject = (name) =>
    supabase
      .from('objects')
      .insert([{ name, description: '' }])
      .select('id, name, description')
      .single()

  const updateObject = (id, data) =>
    supabase
      .from('objects')
      .update(data)
      .eq('id', id)
      .select('id, name, description')
      .single()

  const deleteObject = (id) => supabase.from('objects').delete().eq('id', id)

  return { fetchObjects, insertObject, updateObject, deleteObject }
}
