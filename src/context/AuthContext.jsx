import { createContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase, isSupabaseConfigured } from '../supabaseClient'
import { apiBaseUrl, isApiConfigured } from '../apiConfig'
import logger from '../utils/logger'
import { fetchSession, fetchRole } from '../services/authService'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext({ user: null, role: null })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (!isApiConfigured) {
      logger.error(
        'Не задана переменная окружения VITE_API_BASE_URL. Авторизация через API недоступна.',
      )
      toast.error('Роль недоступна: API не сконфигурирован')
    }

    const loadSession = async () => {
      const { user: currentUser, error: sessionError } = await fetchSession()
      if (sessionError) {
        console.error('Ошибка получения сессии:', sessionError)
        toast.error('Ошибка получения сессии: ' + sessionError.message)
        setUser(null)
        setRole(null)
        return
      }
      setUser(currentUser)
      if (currentUser && isApiConfigured) {
        const { role: fetchedRole, error: roleError } = await fetchRole(
          currentUser.id,
        )
        if (roleError) {
          logger.error('Ошибка получения роли:', roleError)
          toast.error('Ошибка получения роли: ' + roleError.message)
          setRole(null)
        } else {
          setRole(fetchedRole)
        }
      } else {
        setRole(null)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadSession()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    role,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}