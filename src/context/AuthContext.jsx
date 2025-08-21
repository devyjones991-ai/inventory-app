import { createContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase, isSupabaseConfigured } from '../supabaseClient'
import { apiBaseUrl, isApiConfigured } from '../apiConfig'
import logger from '../utils/logger'

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

    let cacheGetAvailable = null

    const checkCacheGetAvailability = async () => {
      if (cacheGetAvailable !== null) return cacheGetAvailable
      try {
        const res = await fetch(`${apiBaseUrl}/functions/v1/cacheGet`, {
          method: 'OPTIONS',
        })
        cacheGetAvailable = res.status !== 404
      } catch {
        cacheGetAvailable = false
      }
      return cacheGetAvailable
    }

    const fetchRole = async (id) => {
      if (!(await checkCacheGetAvailability())) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', id)
            .maybeSingle()
          if (error) throw error
          return { role: data?.role ?? null }
        } catch (error) {
          return { error }
        }
      }
      try {
        const res = await fetch(
          `${apiBaseUrl}/functions/v1/cacheGet?table=${encodeURIComponent('profiles')}&id=${encodeURIComponent(id)}`,
        )
        if (!res.ok) {
          let message
          try {
            const errorBody = await res.clone().json()
            message = errorBody?.message
          } catch {
            // ignore JSON parse errors
          }
          if (!message) {
            message = await res.text()
          }
          if (
            res.status === 404 ||
            message?.includes('Requested function was not found')
          ) {
            cacheGetAvailable = false
            try {
              const { data, error: fallbackError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', id)
                .maybeSingle()
              if (fallbackError) throw fallbackError
              return { role: data?.role ?? null }
            } catch (error) {
              return { error }
            }
          }
          throw new Error(message)
        }
        const body = await res.json()
        return { role: body.data?.role ?? null }
      } catch (error) {
        return { error }
      }
    }

    const fetchSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) throw error
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          if (isApiConfigured) {
            const { role: fetchedRole, error: roleError } = await fetchRole(
              currentUser.id,
            )
            if (roleError) {
              logger.error('Ошибка получения роли:', roleError)
              toast.error('Ошибка получения роли: ' + roleError.message)
              setRole(null)
            } else if (fetchedRole === null) {
              setRole(null)
            } else {
              setRole(fetchedRole)
            }
          } else {
            setRole(null)
          }
        } else {
          setRole(null)
        }
      } catch (error) {
        logger.error('Ошибка получения сессии:', error)
        toast.error('Ошибка получения сессии: ' + error.message)
        setUser(null)
        setRole(null)
      }
    }

    fetchSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        if (isApiConfigured) {
          const { role: fetchedRole, error } = await fetchRole(currentUser.id)
          if (error) {
            logger.error('Ошибка получения роли:', error)
            toast.error('Ошибка получения роли: ' + error.message)
            setRole(null)
          } else if (fetchedRole === null) {
            setRole(null)
          } else {
            setRole(fetchedRole)
          }
        } else {
          setRole(null)
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
