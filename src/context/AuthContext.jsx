import { createContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../supabaseClient'

const baseUrl = import.meta.env.VITE_API_BASE_URL

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext({ user: null, role: null })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const fetchRole = async (id) => {
      const res = await fetch(
        `${baseUrl}/functions/v1/cacheGet?table=profiles&id=${id}`,
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      const body = await res.json()
      return body.data?.role ?? null
    }

    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        try {
          setRole(await fetchRole(currentUser.id))
        } catch (error) {
          console.error('Ошибка получения роли:', error)
          setRole(null)
        }
      } else {
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
        try {
          setRole(await fetchRole(currentUser.id))
        } catch (error) {
          console.error('Ошибка получения роли:', error)
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
