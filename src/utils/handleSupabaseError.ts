// @ts-nocheck
import { supabase } from '../supabaseClient'
import { toast } from 'react-hot-toast'

export async function handleSupabaseError(error, navigate, message) {
  if (!error) return
  if (error.status === 401 || error.status === 403) {
    await supabase.auth.signOut()
    if (navigate) navigate('/auth')
    else if (typeof window !== 'undefined') window.location.href = '/auth'
  } else {
    toast.error(`${message}: ${error.message}`)
  }
}
