/* eslint-env node */
/* globals process */
import '@testing-library/jest-dom'

if (typeof File === 'undefined') {
  globalThis.File = class File extends Blob {
    constructor(parts, name, opts) {
      super(parts, opts)
      this.name = name
    }
  }
}

process.env.VITE_API_BASE_URL = 'http://localhost'
process.env.VITE_SUPABASE_URL = 'http://localhost'
process.env.VITE_SUPABASE_ANON_KEY = 'test-key'

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => {
      const proxy = new Proxy(() => {}, {
        get(target, prop) {
          if (prop === 'then') {
            return (resolve) => resolve({ data: null, error: null })
          }
          return proxy
        },
        apply() {
          return proxy
        },
      })
      return proxy
    },
  }
})
