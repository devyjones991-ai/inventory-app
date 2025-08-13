import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const threshold = Number(Deno.env.get('SLOW_QUERY_THRESHOLD') ?? '500')

  const { data, error } = await supabase
    .from('pg_stat_statements' as any)
    .select('query, mean_time, calls')
    .gt('mean_time', threshold)

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  if (data && data.length) {
    const rows = data.map((d: any) => ({
      query: d.query,
      mean_time: d.mean_time,
      calls: d.calls,
    }))
    await supabase.from('slow_query_logs').insert(rows)
    return new Response(JSON.stringify({ stored: rows.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ stored: 0 }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
