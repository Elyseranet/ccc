import { MATCH_PURPOSE, MATCH_STATUS } from '../../src/enums/match.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import type { IAdminMatch } from '../../src/interfaces/admin-match.interface'

/** Match admin de test : deux côtés, poule 2 par défaut, cible 5. Chaque test surcharge ce dont il a besoin. */
export const buildAdminMatch = (overrides: Partial<IAdminMatch> = {}): IAdminMatch => {
  const status = overrides.status ?? MATCH_STATUS.SCHEDULED
  const recorded = status === MATCH_STATUS.RECORDED || status === MATCH_STATUS.VALIDATED
  const validated = status === MATCH_STATUS.VALIDATED
  return {
    id: 'm1',
    sequence: 69,
    roundKind: ROUND_KIND.POOLS,
    poolRank: 2,
    purpose: MATCH_PURPOSE.REGULAR,
    targetScore: 5,
    status,
    sides: [
      { participationId: 'p1', competitorId: 'c1', displayName: 'Clara Lambert', score: validated ? 5 : null, recordedScore: recorded ? 5 : null },
      { participationId: 'p2', competitorId: 'c2', displayName: 'Paul Girard', score: validated ? 1 : null, recordedScore: recorded ? 1 : null }
    ],
    winnerParticipationId: validated ? 'p1' : null,
    comment: null,
    version: 3,
    recordedAt: recorded ? '2026-11-04T20:00:00.000Z' : null,
    validatedAt: validated ? '2026-11-04T20:05:00.000Z' : null,
    validatedBy: null,
    ...overrides
  }
}
