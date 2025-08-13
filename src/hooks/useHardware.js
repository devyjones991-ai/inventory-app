import { supabase } from '../supabaseClient'

export function useHardware() {
  const fetchHardware = (objectId, { limit = 100, offset = 0 } = {}) =>
    supabase
      .from('hardware')
      .select(
        'id, object_id, name, location, purchase_status, install_status, created_at',
      )
      .eq('object_id', objectId)
      .range(offset, offset + limit - 1)
      .order('created_at')

  const insertHardware = (data) =>
    supabase.from('hardware').insert([data]).select().single()

  const updateHardware = (id, data) =>
    supabase.from('hardware').update(data).eq('id', id).select().single()

  const deleteHardware = (id) => supabase.from('hardware').delete().eq('id', id)

  return { fetchHardware, insertHardware, updateHardware, deleteHardware }
}
