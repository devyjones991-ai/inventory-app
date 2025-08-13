import { supabase } from '../supabaseClient'

export function useHardware() {
  const fetchHardware = (objectId) =>
    supabase
      .from('hardware')
      .select('id, name, location, purchase_status, install_status')
      .eq('object_id', objectId)
      .order('created_at')

  const insertHardware = (data) =>
    supabase
      .from('hardware')
      .insert([data])
      .select('id, name, location, purchase_status, install_status')
      .single()

  const updateHardware = (id, data) =>
    supabase
      .from('hardware')
      .update(data)
      .eq('id', id)
      .select('id, name, location, purchase_status, install_status')
      .single()

  const deleteHardware = (id) => supabase.from('hardware').delete().eq('id', id)

  return { fetchHardware, insertHardware, updateHardware, deleteHardware }
}
