import { beforeEach, describe, expect, it } from '@jest/globals'

jest.mock('@/supabaseClient.js', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}))

import { supabase } from '@/supabaseClient.js'
import { exportInventory, importInventory } from '@/utils/exportImport'

beforeEach(() => {
  supabase.functions.invoke.mockReset()
})

describe('ExportImport utils', () => {
  it('успешно экспортирует данные', async () => {
    const blob = new Blob(['id,name\n1,Item'], { type: 'text/csv' })
    supabase.functions.invoke.mockResolvedValueOnce({ data: blob, error: null })

    const result = await exportInventory()

    expect(supabase.functions.invoke).toHaveBeenCalledWith('export-inventory')
    expect(result).toBe(blob)
  })

  it('успешно импортирует корректный файл', async () => {
    const file = new File(['id,name\n1,Item'], 'data.csv', {
      type: 'text/csv',
    })
    supabase.functions.invoke.mockResolvedValueOnce({
      data: { invalidRows: 0 },
      error: null,
    })

    const res = await importInventory(file)

    expect(supabase.functions.invoke).toHaveBeenCalledWith('import-inventory', {
      body: file,
    })
    expect(res.invalidRows).toBe(0)
  })

  it('обрабатывает ошибку при экспорте', async () => {
    const err = new Error('fail')
    supabase.functions.invoke.mockResolvedValueOnce({ data: null, error: err })

    await expect(exportInventory()).rejects.toThrow('fail')
  })

  it('обрабатывает ошибку и подсчитывает невалидные строки при импорте', async () => {
    const file = new File(['id,name\n1,Item'], 'data.csv', {
      type: 'text/csv',
    })
    supabase.functions.invoke.mockResolvedValueOnce({
      data: { invalidRows: 2 },
      error: null,
    })

    const res = await importInventory(file)
    expect(res.invalidRows).toBe(2)

    const err = new Error('import failed')
    supabase.functions.invoke.mockResolvedValueOnce({ data: null, error: err })
    await expect(importInventory(file)).rejects.toThrow('import failed')
  })
})
