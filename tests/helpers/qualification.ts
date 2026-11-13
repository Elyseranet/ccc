import { TIEBREAK_FORMAT } from '../../src/enums/domain.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../src/enums/match.enum'
import { PARTICIPATION_STATUS } from '../../src/enums/participation.enum'
import { QUALIFICATION_ROUTE, TIEBREAK_SCOPE } from '../../src/enums/qualification.enum'
import type { IPoolStandingRow } from '../../src/interfaces/pool.interface'
import type { IQualificationMember, IQualificationStatus, ITiebreakGroup } from '../../src/interfaces/qualification.interface'
import { buildAdminMatch } from './admin-match'

export const person = (id: string, displayName: string) => ({ id, displayName, firstName: null, lastName: null, nickname: null, avatarUrl: null })

export const member = (id: string, displayName: string): IQualificationMember => ({ participationId: `part-${id}`, competitor: person(id, displayName) })

export const standingRow = (id: string, displayName: string, rank: number, wins: number, played = 3): IPoolStandingRow => ({
  rank,
  participationId: `part-${id}`,
  competitor: person(id, displayName),
  isSeed: false,
  participationStatus: PARTICIPATION_STATUS.REGISTERED,
  played,
  wins,
  losses: played - wins,
  pointsFor: 20,
  pointsAgainst: 15,
  capsAverage: wins - 1,
  unknownResults: 0
})

export const pairTie = (poolId = 'pool-1'): ITiebreakGroup => ({
  scope: TIEBREAK_SCOPE.POOL,
  poolId,
  startRank: 2,
  format: TIEBREAK_FORMAT.ONE_VS_ONE,
  slots: 0,
  members: [member('b', 'Maya Bonnet'), member('c', 'Maël Faure')]
})

export const boundaryTie = (): ITiebreakGroup => ({
  scope: TIEBREAK_SCOPE.BOUNDARY,
  poolId: null,
  startRank: 3,
  format: TIEBREAK_FORMAT.MULTI_SIDES,
  slots: 2,
  members: [member('d', 'Lisa Masson'), member('e', 'Paul Girard'), member('f', 'Eva Michel')]
})

/** État de qualification de test : une poule de 4 (Maya Legrand, Maya Bonnet, Maël Faure, Céleste Marie), tous les matchs validés, aucune égalité par défaut. */
export const buildQualificationStatus = (overrides: Partial<IQualificationStatus> = {}): IQualificationStatus => ({
  listFinalized: false,
  parameters: null,
  pools: [{
    id: 'pool-1',
    rank: 1,
    standing: [standingRow('a', 'Maya Legrand', 1, 3), standingRow('b', 'Maya Bonnet', 2, 2), standingRow('c', 'Maël Faure', 3, 1), standingRow('g', 'Céleste Marie', 4, 0)]
  }, {
    id: 'pool-2',
    rank: 2,
    standing: [standingRow('h', 'Clara Lambert', 1, 3), standingRow('i', 'Paul Dupont', 2, 2), standingRow('j', 'Sam Dupont', 3, 1), standingRow('k', 'Lisa Meyer', 4, 0)]
  }],
  pendingMatchCount: 0,
  ties: [],
  tiebreakMatches: [],
  qualified: [],
  ...overrides
})

export const qualifiedEntry = (id: string, displayName: string, poolId: string, poolRank: number, route = QUALIFICATION_ROUTE.TOP_OF_POOL) => ({
  ...member(id, displayName), poolId, poolRank, route
})

export const tiebreakMatch = (status: MATCH_STATUS, ids: string[]) => buildAdminMatch({
  id: `tb-${ids.join('')}`,
  status,
  purpose: MATCH_PURPOSE.TIEBREAK,
  targetScore: ids.length > 2 ? 3 : 5,
  sides: ids.map(id => ({ participationId: `part-${id}`, competitorId: id, displayName: id, score: null, recordedScore: null }))
})
