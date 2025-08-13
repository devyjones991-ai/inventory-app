import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { isSupabaseConfigured } from './supabaseClient'
import PrivateRoute from './components/PrivateRoute'

const AuthPage = lazy(() => import('./pages/AuthPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const MissingEnvPage = lazy(() => import('./pages/MissingEnvPage'))

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <MissingEnvPage />
      </Suspense>
    )
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Suspense fallback={<div>Loading...</div>}>
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
      </Suspense>
    </BrowserRouter>
  )
}
