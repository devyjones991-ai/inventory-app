import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
const AuthPage = React.lazy(() => import('./pages/AuthPage'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const MissingEnvPage = React.lazy(() => import('./pages/MissingEnvPage'))
import { isSupabaseConfigured } from './supabaseClient'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <React.Suspense fallback={<div>Загрузка...</div>}>
        <MissingEnvPage />
      </React.Suspense>
    )
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <React.Suspense fallback={<div>Загрузка...</div>}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  )
}
