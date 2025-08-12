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

export async function exportTable(table, format) {
  try {
    const res = await fetch(
      `/api/export/${table}?format=${encodeURIComponent(format)}`,
    )
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Export failed (${res.status}): ${text}`)
    }
    return await res.blob()
  } catch (err) {
    console.error('exportTable error:', err)
    throw err
  }
}

export async function importTable(table, file) {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await fetch(`/api/import/${table}`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Import failed (${res.status}): ${text}`)
    }
    const result = await res.json()
    return {
      processedRows: result.processed ?? 0,
      errors: result.errors ?? [],
    }
  } catch (err) {
    console.error('importTable error:', err)
    throw err
  }
}
