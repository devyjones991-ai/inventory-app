import { createContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase, isSupabaseConfigured } from '../supabaseClient'
import { isApiConfigured } from '../apiConfig'
import { fetchSession, fetchRole } from '../services/authService'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext({ user: null, role: null })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (!isApiConfigured) {
      console.error(
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
          console.error('Ошибка получения роли:', roleError)
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser && isApiConfigured) {
        const { role: fetchedRole, error } = await fetchRole(currentUser.id)
        if (error) {
          console.error('Ошибка получения роли:', error)
          toast.error('Ошибка получения роли: ' + error.message)
          setRole(null)
        } else {
          setRole(fetchedRole)
        }
      } else {
        setRole(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, role }}>
      {children}
    </AuthContext.Provider>
  )
}
