import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import type { User } from '@supabase/supabase-js'

interface AuthInfo {
  user: User | null
  isAdmin: boolean
  isManager: boolean
  isUser: boolean
}

export function useAuth(): AuthInfo {
  const { user, role } = useContext(AuthContext)
  return {
    user,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isUser: role === 'user',
  }
}
