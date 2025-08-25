import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts'
import { handler } from './index.ts'

Deno.test('запрещённая таблица возвращает 403', async () => {
  const req = new Request('http://localhost/export/forbidden/csv')
  const res = await handler(req)
  assertEquals(res.status, 403)
})

Deno.test('недопустимый параметр фильтра возвращает 403', async () => {
  const req = new Request('http://localhost/export/objects/csv?col$=1')
  const res = await handler(req)
  assertEquals(res.status, 403)
})

Deno.test('разрешённая таблица и фильтр возвращают 200', async () => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = (input: Request | string) => {
    const url = typeof input === 'string' ? input : input.url
    if (url.endsWith('/auth/v1/user')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({ user: { app_metadata: { roles: ['admin'] } } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    }
    if (url.includes('/rest/v1/')) {
      return Promise.resolve(
        new Response('[]', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }
    return Promise.resolve(new Response(null, { status: 404 }))
  }

  Deno.env.set('SUPABASE_URL', 'https://example.supabase.co')
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'key')

  const req = new Request('http://localhost/export/objects/csv', {
    headers: { Authorization: 'Bearer token' },
  })
  const res = await handler(req)
  assertEquals(res.status, 200)
  assertEquals(res.headers.get('Content-Type'), 'text/csv')

  globalThis.fetch = originalFetch
})
