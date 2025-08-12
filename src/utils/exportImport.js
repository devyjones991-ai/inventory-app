import { supabase } from '../supabaseClient'

export async function exportInventory() {
  const { data, error } = await supabase.functions.invoke('export-inventory')
  if (error) throw error
  return data
}

export async function importInventory(file) {
  const { data, error } = await supabase.functions.invoke('import-inventory', {
    body: file,
  })
  if (error) throw error
  return data
}
