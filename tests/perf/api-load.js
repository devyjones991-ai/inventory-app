/* global __ENV */
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
}

export default function () {
  const url = `${__ENV.API_BASE_URL}/rest/v1/tasks`
  const res = http.get(url, {
    headers: {
      apikey: __ENV.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${__ENV.SUPABASE_ANON_KEY}`,
    },
  })

  check(res, { 'status 200': (r) => r.status === 200 })
  sleep(1)
}
