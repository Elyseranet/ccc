import { USER_ROLE } from '../../src/enums/user.enum'
import type { IMe } from '../../src/interfaces/me.interface'

/** Un `IMe` de test pour le store d'authentification (jamais servi par l'application : ARCH-8). */
export const buildMe = (role: USER_ROLE, overrides: Partial<IMe> = {}): IMe => ({
  id: 'user-test',
  email: 'compte@example.test',
  role,
  competitor: null,
  ...overrides
})

export const buildMeWithCompetitor = (role: USER_ROLE = USER_ROLE.PARTICIPANT, displayName = 'Sam Dupont'): IMe => buildMe(role, {
  competitor: {
    id: 'competitor-test',
    displayName,
    firstName: 'Sam',
    lastName: 'Dupont',
    nickname: 'Rebond',
    avatarUrl: null,
    phone: null
  }
})
