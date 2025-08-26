import React from 'react'
import { isApiConfigured } from '@/apiConfig'
import { isSupabaseConfigured } from '@/supabaseClient'

export default function MissingEnvPage() {
  const missingVars = []
  const targets = []

  if (!isSupabaseConfigured) {
    missingVars.push('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY')
    targets.push('базе данных')
  }

  if (!isApiConfigured) {
    missingVars.push('VITE_API_BASE_URL')
    targets.push('API')
  }

  const varsText = missingVars.join(', ')
  const prefix =
    missingVars.length > 1 ? 'Переменные окружения' : 'Переменная окружения'
  const targetsText = targets.join(' и ')

  return (
    <div className="flex h-screen items-center justify-center bg-base-200 transition-colors">
      <div className="flex w-full min-h-screen items-center justify-center bg-base-200">
        <div className="space-y-4 max-w-md text-center">
          <div className="alert alert-error shadow-lg">
            <span>
              {prefix} {varsText} не заданы. Приложение не может подключиться к{' '}
              {targetsText} и работает в ограниченном режиме.
            </span>
          </div>
          {!isApiConfigured && (
            <div className="alert alert-warning shadow-lg">
              <span>
                Без API недоступны управление объектами, импорт и экспорт
                данных, а также получение ролей пользователей.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
