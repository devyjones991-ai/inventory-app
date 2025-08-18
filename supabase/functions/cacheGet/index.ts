import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Redis } from 'https://deno.land/x/upstash_redis@v1.22.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,DELETE,OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  const url = new URL(req.url)
  const table = url.searchParams.get('table')
  const allowedTables = ['profiles', 'objects']
  const id = url.searchParams.get('id')

  if (!table) {
    return new Response(JSON.stringify({ error: 'table is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!allowedTables.includes(table)) {
    return new Response(JSON.stringify({ error: 'table is not allowed' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token)
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const cached = await redis.get<string>(key)
  if (cached) {
    return new Response(cached, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
      },
    })
  }

  let query
  if (id) {
    query = supabase.from(table).select('*').eq('id', id).maybeSingle()
  } else {
    query = supabase.from(table).select('*')
  }

  const { data, error } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  await redis.set(key, JSON.stringify({ data }), { ex: 3600 })

  return new Response(JSON.stringify({ data }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
    },
  })
})
