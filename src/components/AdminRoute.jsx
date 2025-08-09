import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthContext } from '../context/AuthContext'
import Spinner from './Spinner'

export default function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  const { role } = useContext(AuthContext)

  if (user && role === null) {
    return <Spinner />
  }

  return isAdmin ? children : <Navigate to="/" replace />
}
