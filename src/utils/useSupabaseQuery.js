import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useSupabaseQuery(queryBuilder, deps = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setIsError(null);

    async function run() {
      try {
        const { data, error } = await queryBuilder(supabase);
        if (!active) return;
        if (error) {
          setIsError(error);
          setData(null);
        } else {
          setData(data);
        }
      } catch (err) {
        if (active) {
          setIsError(err);
          setData(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, deps);

  return { data, isLoading, isError };
}
