import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Redis } from 'https://deno.land/x/upstash_redis@v1.22.0/mod.ts'

serve(async (req) => {
  const url = new URL(req.url)
  const table = url.searchParams.get('table')
  const id = url.searchParams.get('id')

  if (!table) {
    return new Response(JSON.stringify({ error: 'table is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const redis = new Redis({
    url: Deno.env.get('REDIS_URL') ?? '',
    token: Deno.env.get('REDIS_TOKEN') ?? '',
  })

  const key = id ? `${table}:${id}` : table

  if (req.method === 'DELETE') {
    await redis.del(key)
    return new Response(JSON.stringify({ status: 'invalidated' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const cached = await redis.get<string>(key)
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  let query
  if (id) {
    query = supabase.from(table).select('*').eq('id', id).single()
  } else {
    query = supabase.from(table).select('*')
  }

  const { data, error } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  await redis.set(key, JSON.stringify({ data }), { ex: 3600 })

  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
  })
})
