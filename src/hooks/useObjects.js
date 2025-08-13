import { supabase } from '../supabaseClient'

export function useObjects() {
  const fetchObjects = ({ limit = 100, offset = 0 } = {}) =>
    supabase
      .from('objects')
      .select('id, name, description, created_at')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: true })

  const insertObject = (name) =>
    supabase
      .from('objects')
      .insert([{ name, description: '' }])
      .select()
      .single()

  const updateObject = (id, data) =>
    supabase.from('objects').update(data).eq('id', id).select().single()

  const deleteObject = (id) => supabase.from('objects').delete().eq('id', id)

  return { fetchObjects, insertObject, updateObject, deleteObject }
}
