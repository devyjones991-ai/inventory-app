import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { isSupabaseConfigured } from './supabaseClient'
import { isApiConfigured } from './apiConfig'
import PrivateRoute from './components/PrivateRoute'

const AuthPage = lazy(() => import('./pages/AuthPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const MissingEnvPage = lazy(() => import('./pages/MissingEnvPage'))

export default function App() {
  if (!isSupabaseConfigured || !isApiConfigured) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <MissingEnvPage />
      </Suspense>
    )
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
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
      </Suspense>
    </BrowserRouter>
  )
}
