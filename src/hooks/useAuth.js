import { supabase } from '../supabaseClient';

export function useAuth() {
  const getSession = () => supabase.auth.getSession();
  const onAuthStateChange = callback => supabase.auth.onAuthStateChange(callback);
  const signUp = (email, password, username) =>
    supabase.auth.signUp({ email, password, options: { data: { username } } });
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = () => supabase.auth.signOut();
  return { getSession, onAuthStateChange, signUp, signIn, signOut };
}
