import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

export function useAuth() {
  const { user, isLoading } = useContext(AuthContext)
  return {
    user,
    isLoading,
  }
}
