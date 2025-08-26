import { supabase } from '@/supabaseClient'
import { handleSupabaseError } from '@/utils/handleSupabaseError'
import { useNavigate } from 'react-router-dom'

export function useHardware() {
  const navigate = useNavigate()

  const fetchHardware = async (objectId) => {
    try {
      const result = await supabase
        .from('hardware')
        .select('id, name, location, purchase_status, install_status')
        .eq('object_id', objectId)
        .order('created_at')
      if (result.error) throw result.error
      return result
    } catch (error) {
      await handleSupabaseError(error, navigate, 'Ошибка загрузки оборудования')
      return { data: null, error }
    }
  }

  const insertHardware = async (data) => {
    try {
      const result = await supabase
        .from('hardware')
        .insert([data])
        .select('id, name, location, purchase_status, install_status')
        .single()
      if (result.error) throw result.error
      return result
    } catch (error) {
      await handleSupabaseError(
        error,
        navigate,
        'Ошибка добавления оборудования',
      )
      return { data: null, error }
    }
  }

  const updateHardware = async (id, data) => {
    try {
      const result = await supabase
        .from('hardware')
        .update(data)
        .eq('id', id)
        .select('id, name, location, purchase_status, install_status')
        .single()
      if (result.error) throw result.error
      return result
    } catch (error) {
      await handleSupabaseError(
        error,
        navigate,
        'Ошибка обновления оборудования',
      )
      return { data: null, error }
    }
  }

  const deleteHardware = async (id) => {
    try {
      const result = await supabase.from('hardware').delete().eq('id', id)
      if (result.error) throw result.error
      return result
    } catch (error) {
      await handleSupabaseError(error, navigate, 'Ошибка удаления оборудования')
      return { data: null, error }
    }
  }

  return { fetchHardware, insertHardware, updateHardware, deleteHardware }
}
