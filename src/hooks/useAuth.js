import { supabase } from '../supabaseClient'
import { pushNotification } from '../utils/notifications'

export function useAuth() {
  const getSession = () => supabase.auth.getSession()
  const onAuthStateChange = (callback) =>
    supabase.auth.onAuthStateChange(callback)
  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (!error && data.user && !data.user.confirmed_at) {
      pushNotification(
        'Регистрация',
        'Проверьте почту для подтверждения аккаунта',
      )
    }
    return { data, error }
  }
  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()
  return { getSession, onAuthStateChange, signUp, signIn, signOut }
}
