import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface Props {
  children: ReactNode
}

export default function PrivateRoute({ children }: Props) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/auth" replace />
}
