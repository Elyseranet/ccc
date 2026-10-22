import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { USER_ROLE } from '../../../src/enums/user.enum'
import { useAuthStore } from '../../../src/composables/useAuthStore'

describe('store d’authentification', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('démarre sans session', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.isAdmin).toBe(false)
  })

  it('distingue administrateur et participant', () => {
    const auth = useAuthStore()
    auth.setRole(USER_ROLE.PARTICIPANT)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.isAdmin).toBe(false)
    auth.setRole(USER_ROLE.ADMIN)
    expect(auth.isAdmin).toBe(true)
    auth.clear()
    expect(auth.isAuthenticated).toBe(false)
  })
})
