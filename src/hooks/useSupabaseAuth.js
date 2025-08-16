import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { pushNotification } from '../utils/notifications'

export function useSupabaseAuth() {
  const [error, setError] = useState(null)

  const getSession = () => supabase.auth.getSession()
  const onAuthStateChange = (callback) =>
    supabase.auth.onAuthStateChange(callback)

  const signUp = async (email, password, username) => {
    setError(null)

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        })

      if (signUpError) {
        setError(signUpError.message)
      } else if (signUpData.user && signUpData.user.confirmed_at === null) {
        pushNotification(
          'Регистрация',
          'Проверьте почту для подтверждения аккаунта',
        )
      }

      return { data: signUpData, error: signUpError }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const signIn = async (email, password) => {
    setError(null)
    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })
      if (signInError) {
        setError(signInError.message)
      }
      return { data, error: signInError }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const signOut = () => supabase.auth.signOut()

  return { getSession, onAuthStateChange, signUp, signIn, signOut, error }
}
