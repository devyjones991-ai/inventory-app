import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { unparse } from 'https://esm.sh/papaparse@5.4.1'
import ExcelJS from 'https://esm.sh/exceljs@4?target=deno'

serve(async (req: Request) => {
  const url = new URL(req.url)
  const segments = url.pathname.split('/').filter(Boolean)
  // Expected path: /export/:table/:format
  if (segments.length < 3) {
    return new Response('Missing parameters', { status: 400 })
  }
  const table = segments[1]
  const format = segments[2]

  const columnsParam = url.searchParams.get('columns')
  const selectedColumns = columnsParam?.split(',')
  const filters: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    if (key !== 'columns') filters[key] = value
  })

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token)
  if (userError || !userData?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const roles =
    (userData.user.app_metadata?.roles as string[] | undefined) || []
  if (!roles.includes('admin')) {
    return new Response('Forbidden', { status: 403 })
  }

  if (format === 'csv') {
    const batchSize = 1000
    let start = 0
    let firstChunk = true
    let header: string[] | undefined = selectedColumns
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async pull(controller) {
        let query = supabase
          .from(table)
          .select(selectedColumns?.join(',') || '*')
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
        const { data, error } = await query.range(start, start + batchSize - 1)
        if (error) {
          controller.error(error)
          return
        }
        if (!data || data.length === 0) {
          controller.close()
          return
        }
        if (!header && data.length) {
          header = Object.keys(data[0])
        }
        const csv = unparse(data, { header: firstChunk, columns: header })
        controller.enqueue(encoder.encode(csv + '\n'))
        firstChunk = false
        start += batchSize
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${table}.csv"`,
      },
    })
  }

  if (format === 'xlsx') {
    const batchSize = 1000
    const { readable, writable } = new TransformStream()

    ;(async () => {
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: writable,
      })
      const worksheet = workbook.addWorksheet(table)
      if (selectedColumns) {
        worksheet.columns = selectedColumns.map((c) => ({ header: c, key: c }))
      }
      let start = 0
      while (true) {
        let query = supabase
          .from(table)
          .select(selectedColumns?.join(',') || '*')
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
        const { data, error } = await query.range(start, start + batchSize - 1)
        if (error) {
          writable.abort(error)
          return
        }
        if (!data || data.length === 0) break
        data.forEach((row) => worksheet.addRow(row).commit())
        start += batchSize
      }
      await workbook.commit()
    })()

    return new Response(readable, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${table}.xlsx"`,
      },
    })
  }

  return new Response('Invalid format', { status: 400 })
})
