import { createContext, useEffect, useState, ReactNode } from 'react'
import { toast } from 'react-hot-toast'
// @ts-ignore
import {
  supabase as supabaseClient,
  isSupabaseConfigured,
} from '../supabaseClient'
import { apiBaseUrl, isApiConfigured } from '../apiConfig'
import type { User, SupabaseClient } from '@supabase/supabase-js'

// @ts-ignore
const supabase = supabaseClient as SupabaseClient

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<{
  user: User | null
  role: string | null
}>({
  user: null,
  role: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (!isApiConfigured) {
      console.error(
        'Не задана переменная окружения VITE_API_BASE_URL. Авторизация через API недоступна.',
      )
      toast.error('Роль недоступна: API не сконфигурирован')
    }

    let cacheGetAvailable: boolean | null = null

    const checkCacheGetAvailability = async (): Promise<boolean> => {
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

    const fetchRole = async (
      id: string,
    ): Promise<{ role: string | null; error?: any }> => {
      if (!(await checkCacheGetAvailability())) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', id)
            .maybeSingle()
          if (error) throw error
          return { role: data?.role ?? null }
        } catch (error: any) {
          return { role: null, error }
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
            } catch (error: any) {
              return { role: null, error }
            }
          }
          throw new Error(message)
        }
        const body = await res.json()
        return { role: body.data?.role ?? null }
      } catch (error: any) {
        return { role: null, error }
      }
    }

    const fetchSession = async (): Promise<void> => {
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
              console.error('Ошибка получения роли:', roleError)
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
      } catch (error: any) {
        console.error('Ошибка получения сессии:', error)
        toast.error('Ошибка получения сессии: ' + error.message)
        setUser(null)
        setRole(null)
      }
    }

    fetchSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        if (isApiConfigured) {
          const { role: fetchedRole, error } = await fetchRole(currentUser.id)
          if (error) {
            console.error('Ошибка получения роли:', error)
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
