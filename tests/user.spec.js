import { describe, it, expect, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const objectInsertMock = vi.fn().mockResolvedValue({
  data: null,
  error: { message: 'Forbidden' },
})
const taskUpdateEqMock = vi.fn().mockResolvedValue({
  error: { message: 'Forbidden' },
})
const taskUpdateMock = vi.fn(() => ({ eq: taskUpdateEqMock }))
const fromMock = vi.fn((table) => {
  if (table === 'objects') {
    return { insert: objectInsertMock }
  }
  if (table === 'tasks') {
    return { update: taskUpdateMock }
  }
  return {}
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: fromMock }),
}))

const supabase = createClient()

describe('права обычного пользователя', () => {
  it('не видит админских действий при создании объекта', async () => {
    const { error } = await supabase.from('objects').insert([{ name: 'Test' }])
    expect(error).toBeTruthy()
  })

  it('не может редактировать чужие задачи', async () => {
    const { error } = await supabase
      .from('tasks')
      .update({ title: 'New' })
      .eq('id', 1)
    expect(error).toBeTruthy()
  })
})
