import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { unparse } from 'https://esm.sh/papaparse@5.4.1'
import XLSX from 'https://esm.sh/xlsx@0.18.5'

serve(async (req: Request) => {
  const url = new URL(req.url)
  const segments = url.pathname.split('/').filter(Boolean)
  // Expected path: /export/:table/:format
  if (segments.length < 3) {
    return new Response('Missing parameters', { status: 400 })
  }
  const table = segments[1]
  const format = segments[2]

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const roles = (userData.user.app_metadata?.roles as string[] | undefined) || []
  if (!roles.includes('admin')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { data, error } = await supabase.from(table).select('*')
  if (error) {
    return new Response(error.message, { status: 400 })
  }

  if (format === 'csv') {
    const csv = unparse(data ?? [])
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${table}.csv"`
      }
    })
  }

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(data ?? [])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, table)
    const xlsx = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Response(xlsx, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${table}.xlsx"`
      }
    })
  }

  return new Response('Invalid format', { status: 400 })
})

