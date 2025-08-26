import { supabase } from '@/supabaseClient'
import { apiBaseUrl, isApiConfigured } from '@/apiConfig'
import logger from './logger'
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
export async function exportTable(table, format) {
  if (!isApiConfigured) {
    logger.error(
      'Не задана переменная окружения VITE_API_BASE_URL. Экспорт невозможен.',
    )
    throw new Error('API не настроен')
  }
  try {
    const res = await fetch(
      `${apiBaseUrl}/api/export/${table}?format=${encodeURIComponent(format)}`,
    )
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Export failed (${res.status}): ${text}`)
    }
    return await res.blob()
  } catch (err) {
    logger.error('exportTable error:', err)
    throw err
  }
}
export async function importTable(table, file) {
  const formData = new FormData()
  formData.append('file', file)
  if (!isApiConfigured) {
    logger.error(
      'Не задана переменная окружения VITE_API_BASE_URL. Импорт невозможен.',
    )
    throw new Error('API не настроен')
  }
  try {
    const res = await fetch(`${apiBaseUrl}/api/import/${table}`, {
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
    logger.error('importTable error:', err)
    throw err
  }
}
