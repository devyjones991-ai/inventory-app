import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import MissingEnvPage from './pages/MissingEnvPage'
import { isSupabaseConfigured } from './supabaseClient'
import PrivateRoute from '@/features/auth/components/PrivateRoute'

export default function App() {
  if (!isSupabaseConfigured) {
    return <MissingEnvPage />
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
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
    </BrowserRouter>
  )
}
