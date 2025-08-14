import { createContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase, isSupabaseConfigured } from '../supabaseClient'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext({ user: null, role: null })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const fetchRole = async (id) => {
      try {
        const res = await fetch(
          `/functions/v1/cacheGet?table=profiles&id=${id}`,
        )
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text)
        }
        const body = await res.json()
        return { role: body.data?.role ?? null }
      } catch (error) {
        toast.error('Ошибка получения роли: ' + error.message)
        return { error }
      }
    }

    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
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
    }

    fetchSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
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
