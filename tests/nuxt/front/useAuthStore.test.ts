import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { USER_ROLE } from '../../../src/enums/user.enum'
import { useAuthStore } from '../../../src/composables/useAuthStore'
import { buildMe, buildMeWithCompetitor } from '../../helpers/me'

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
    auth.setMe(buildMe(USER_ROLE.PARTICIPANT))
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.isAdmin).toBe(false)
    auth.setMe(buildMe(USER_ROLE.ADMIN))
    expect(auth.isAdmin).toBe(true)
    auth.clear()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('dérive le rôle et les initiales de l’IMe reçu, sans second état', () => {
    const auth = useAuthStore()
    auth.setMe(buildMeWithCompetitor())
    expect(auth.role).toBe(USER_ROLE.PARTICIPANT)
    expect(auth.initials).toBe('SD')
    auth.setMe(buildMe(USER_ROLE.ADMIN, { email: 'orga@example.test' }))
    expect(auth.initials).toBe('O')
    auth.clear()
    expect(auth.role).toBeNull()
    expect(auth.initials).toBeNull()
  })
})
