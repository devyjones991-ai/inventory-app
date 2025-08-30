import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

/**
 * Хук для выполнения запроса к Supabase.
 * @param {Function} queryBuilder функция формирования запроса. Добавлена в массив зависимостей.
 * @param {Array} deps дополнительные зависимости, при изменении которых запрос должен переисполняться.
 * Передавайте дополнительные зависимости явно, чтобы избежать устаревших данных.
 */
export function useSupabaseQuery(queryBuilder, deps = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // queryBuilder присутствует в массиве зависимостей; указывайте дополнительные deps через параметр
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    async function run() {
      try {
        const { data, error } = await queryBuilder(supabase, controller.signal);
        if (!active) return;
        if (error) {
          setError(error);
          setData(null);
        } else {
          setData(data);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (active) {
          setError(err);
          setData(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    run();
    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryBuilder, ...deps]);

  return { data, isLoading, error };
}
