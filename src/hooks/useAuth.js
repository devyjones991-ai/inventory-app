import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  const { user, role } = useContext(AuthContext)
  return { user, isAdmin: role === 'admin', isUser: role === 'user' }
}
