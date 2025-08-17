import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('@/supabaseClient.js', () => ({
  isSupabaseConfigured: false,
}))
jest.mock('@/apiConfig.js', () => ({
  isApiConfigured: false,
}))

import App from '@/App'

describe('MissingEnvPage', () => {
  it('отображает предупреждение при отсутствии переменных окружения', async () => {
    render(<App />)
    expect(
      await screen.findByText(
        /VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL не заданы/i,
      ),
    ).toBeInTheDocument()
  })
})
