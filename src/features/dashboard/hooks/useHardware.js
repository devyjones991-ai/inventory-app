import { supabase } from '@/supabaseClient'

export function useHardware() {
  const fetchHardware = (objectId) =>
    supabase
      .from('hardware')
      .select('*')
      .eq('object_id', objectId)
      .order('created_at')

  const insertHardware = (data) =>
    supabase.from('hardware').insert([data]).select().single()

  const updateHardware = (id, data) =>
    supabase.from('hardware').update(data).eq('id', id).select().single()

  const deleteHardware = (id) => supabase.from('hardware').delete().eq('id', id)

  return { fetchHardware, insertHardware, updateHardware, deleteHardware }
}
