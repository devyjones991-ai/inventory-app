import { supabase } from '../supabaseClient';

export function useAccount() {
  const updateProfile = data => supabase.auth.updateUser({ data });
  return { updateProfile };
}
