import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_USER } from '../constants/roles.js'

export function useAuth() {
  const { user, role, isLoading } = useContext(AuthContext)
  return {
    user,
    isLoading,
    isAdmin: role === ROLE_ADMIN,
    isManager: role === ROLE_MANAGER,
    isUser: role === ROLE_USER,
  }
}
