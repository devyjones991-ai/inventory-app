// @ts-nocheck
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

let supabase

if (!isSupabaseConfigured) {
  console.error(
    'Не заданы переменные окружения VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY.',
  )
  const handler = {
    get() {
      return new Proxy(() => {
        console.error(
          'Попытка обращения к Supabase при отсутствии конфигурации.',
        )
        return Promise.reject(new Error('Supabase не инициализирован'))
      }, handler)
    },
    apply() {
      console.error('Попытка обращения к Supabase при отсутствии конфигурации.')
      return Promise.reject(new Error('Supabase не инициализирован'))
    },
  }
  supabase = new Proxy(() => {}, handler)
} else {
  supabase = createClient(supabaseUrl, supabaseKey)
}

export { supabase }
