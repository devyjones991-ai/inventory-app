import { supabase } from '../supabaseClient'
import { pushNotification } from '../utils/notifications'
import { useState } from 'react'

export function useAuthActions() {
  const [error, setError] = useState(null)

  const getSession = () => supabase.auth.getSession()
  const onAuthStateChange = (callback) =>
    supabase.auth.onAuthStateChange(callback)

  const signUp = async (email, password, username) => {
    setError(null)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: { data: { username } },
      },
    )

    if (signUpError) {
      setError(signUpError.message)
    } else if (signUpData.user && signUpData.user.confirmed_at === null) {
      pushNotification(
        'Регистрация',
        'Проверьте почту для подтверждения аккаунта',
      )
      setError('Проверьте почту для подтверждения аккаунта')
    }

    return { data: signUpData, error: signUpError }
  }

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signOut = () => supabase.auth.signOut()

  return { getSession, onAuthStateChange, signUp, signIn, signOut, error }
}
