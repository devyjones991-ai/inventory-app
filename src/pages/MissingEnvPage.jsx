import React from 'react'

export default function MissingEnvPage() {
  return (

    <div className="flex h-screen items-center justify-center bg-base-200 transition-colors">

    <div className="flex w-full min-h-screen items-center justify-center bg-base-200">

      <div className="alert alert-error max-w-md text-center shadow-lg">
        <span>
          Переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY не
          заданы. Приложение не может подключиться к базе данных и работает в
          ограниченном режиме.
        </span>
      </div>
    </div>
  )
}
