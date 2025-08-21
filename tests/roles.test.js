import { ROLE_ADMIN, ROLE_MANAGER, ROLE_USER } from '@/constants/roles.js'

describe('roles constants', () => {
  test('ROLE_ADMIN value', () => {
    expect(ROLE_ADMIN).toBe('admin')
  })
  test('ROLE_MANAGER value', () => {
    expect(ROLE_MANAGER).toBe('manager')
  })
  test('ROLE_USER value', () => {
    expect(ROLE_USER).toBe('user')
  })
})
