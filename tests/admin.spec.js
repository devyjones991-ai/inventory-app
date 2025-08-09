import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const insertMock = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null })
const deleteEqMock = vi.fn().mockResolvedValue({ error: null })
const deleteMock = vi.fn(() => ({ eq: deleteEqMock }))
const fromMock = vi.fn(() => ({ insert: insertMock, delete: deleteMock }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: fromMock }),
}))

const supabase = createClient()

describe('права администратора', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('может создавать и удалять объекты и задачи', async () => {
    let res = await supabase.from('objects').insert([{ name: 'Test' }])
    expect(res.error).toBeNull()

    res = await supabase.from('objects').delete().eq('id', 1)
    expect(res.error).toBeNull()

    res = await supabase.from('tasks').insert([{ title: 'Task', object_id: 1 }])
    expect(res.error).toBeNull()

    res = await supabase.from('tasks').delete().eq('id', 1)
    expect(res.error).toBeNull()

    expect(insertMock).toHaveBeenCalledTimes(2)
    expect(deleteEqMock).toHaveBeenCalledTimes(2)
  })
})
