import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  const { user, role } = useContext(AuthContext)
  return {
    user,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isUser: role === 'user',
  }
}
