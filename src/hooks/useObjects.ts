// @ts-nocheck
import { supabase } from '../supabaseClient'
import { apiBaseUrl, isApiConfigured } from '../apiConfig'

export function useObjects() {
  if (!isApiConfigured) {
    console.error(
      'Не задана переменная окружения VITE_API_BASE_URL. Работа с объектами недоступна.',
    )
    const error = new Error('API не настроен')
    const reject = async () => ({ data: null, error })
    return {
      fetchObjects: reject,
      insertObject: reject,
      updateObject: reject,
      deleteObject: reject,
    }
  }

  const cacheUrl = `${apiBaseUrl}/functions/v1/cacheGet?table=objects`

  const fetchObjects = async () => {
    try {
      const res = await fetch(cacheUrl)
      if (!res.ok) {
        return { data: null, error: new Error(await res.text()) }
      }
      const body = await res.json()
      return { data: body.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const invalidate = () => fetch(cacheUrl, { method: 'DELETE' })

  const insertObject = async (name) => {
    const result = await supabase
      .from('objects')
      .insert([{ name, description: '' }])
      .select('id, name, description')
      .single()
    if (!result.error) await invalidate()
    return result
  }

  const updateObject = async (id, data) => {
    const result = await supabase
      .from('objects')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (!result.error) await invalidate()
    return result
  }

  const deleteObject = async (id) => {
    const result = await supabase.from('objects').delete().eq('id', id)
    if (!result.error) await invalidate()
    return result
  }

  return {
    fetchObjects,
    insertObject,
    updateObject,
    deleteObject,
  }
}
