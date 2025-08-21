import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_USER } from '../constants/roles.js'

export function useAuth() {
  const { user, role } = useContext(AuthContext)
  return {
    user,
    isAdmin: role === ROLE_ADMIN,
    isManager: role === ROLE_MANAGER,
    isUser: role === ROLE_USER,
  }
}
