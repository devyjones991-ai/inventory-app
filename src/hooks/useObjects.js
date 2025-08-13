import { supabase } from '../supabaseClient'

export function useObjects() {
  const cacheUrl = '/functions/v1/cacheGet?table=objects'

  const fetchObjects = async () => {
    const res = await fetch(cacheUrl)
    if (!res.ok) {
      return { data: null, error: new Error(await res.text()) }
    }
    const body = await res.json()
    return { data: body.data, error: null }
  }

  const invalidate = () => fetch(cacheUrl, { method: 'DELETE' })

  const insertObject = async (name) => {
    const result = await supabase
      .from('objects')
      .insert([{ name, description: '' }])
      .select()
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

  return { fetchObjects, insertObject, updateObject, deleteObject }
}
