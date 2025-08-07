import React, { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Auth from '../components/Auth';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let subscription;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/', { replace: true });
    });
    ({ data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/', { replace: true });
    }));
    return () => subscription?.unsubscribe();
  }, [navigate]);

  return <Auth />;
}
