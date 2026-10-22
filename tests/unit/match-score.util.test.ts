import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../src/enums/match.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import type { MatchEntity } from '../../src/server/db/typeorm/entities/match.entity'
import { toApiError } from '../../src/utils/api-error.util'
import { toAdminMatch } from '../../src/utils/match-admin.mapper.util'
import { alignScores, hasSameScores, parseAdminMatchListQuery, parseIfMatchVersion } from '../../src/utils/match-score.util'

const side = (position: number, participationId: string, recordedScore: number | null, validatedScore: number | null) => ({
  id: `side-${position}`,
  matchId: 'm1',
  position,
  participationId,
  recordedScore,
  validatedScore,
  participation: { competitorId: `c-${participationId}`, competitor: { displayName: `Joueur ${participationId}` } }
})

const buildMatch = (overrides: Partial<MatchEntity> = {}): MatchEntity => ({
  id: 'm1',
  editionId: 'e1',
  roundId: 'r1',
  poolId: 'p1',
  sequence: 4,
  legacyCode: null,
  purpose: MATCH_PURPOSE.REGULAR,
  targetScore: 5,
  status: MATCH_STATUS.RECORDED,
  comment: 'private note',
  recordedAt: new Date('2026-10-01T20:00:00Z'),
  validatedAt: null,
  validatedByUserId: null,
  validatedBy: null,
  version: 3,
  round: { kind: ROUND_KIND.POOLS },
  pool: { rank: 2 },
  // Position inversée dans le tableau : l'ordre de `position` fait foi.
  sides: [side(2, 'b', 3, null), side(1, 'a', 5, null)],
  ...overrides
} as unknown as MatchEntity)

describe('parseIfMatchVersion', () => {
  it('reads a bare, quoted or weak version', () => {
    expect(parseIfMatchVersion('3')).toBe(3)
    expect(parseIfMatchVersion('"3"')).toBe(3)
    expect(parseIfMatchVersion('W/"12"')).toBe(12)
  })

  it('is undefined without header and 400 when malformed', () => {
    expect(parseIfMatchVersion(undefined)).toBeUndefined()
    for (const bad of ['', 'abc', '-1', '1.5', '*']) {
      expect(() => parseIfMatchVersion(bad), bad).toThrowError()
    }
  })
})

describe('alignScores', () => {
  const match = buildMatch()

  it('orders scores by side position', () => {
    expect(alignScores(match, [{ participationId: 'b', score: 3 }, { participationId: 'a', score: 5 }])).toEqual([5, 3])
  })

  it.each([
    ['a missing side', [{ participationId: 'a', score: 5 }]],
    ['a foreign participant', [{ participationId: 'a', score: 5 }, { participationId: 'x', score: 3 }]],
    ['a repeated participant', [{ participationId: 'a', score: 5 }, { participationId: 'a', score: 3 }]]
  ])('refuses %s with 400 VALIDATION_FAILED', (_label, scores) => {
    try {
      alignScores(match, scores)
      expect.unreachable()
    } catch (error) {
      const apiError = toApiError(error)
      expect(apiError.statusCode).toBe(400)
      expect(apiError.code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
    }
  })
})

describe('hasSameScores', () => {
  it('compares position by position, null never matches', () => {
    expect(hasSameScores([5, 3], [5, 3])).toBe(true)
    expect(hasSameScores([5, 3], [3, 5])).toBe(false)
    expect(hasSameScores([null, null], [0, 0])).toBe(false)
    expect(hasSameScores([5], [5, 3])).toBe(false)
  })
})

describe('toAdminMatch', () => {
  it('exposes the real status, the recorded score, the comment and the version', () => {
    const admin = toAdminMatch(buildMatch())
    expect(admin.status).toBe(MATCH_STATUS.RECORDED)
    expect(admin.sides.map((s) => [s.participationId, s.recordedScore, s.score])).toEqual([['a', 5, null], ['b', 3, null]])
    expect(admin.comment).toBe('private note')
    expect(admin.version).toBe(3)
    expect(admin.validatedBy).toBeNull()
  })

  it('reports the author of the validation, by competitor name then email', () => {
    const named = toAdminMatch(buildMatch({
      validatedBy: { id: 'u1', email: 'x@example.test', competitor: { displayName: 'Arnaud' } } as MatchEntity['validatedBy']
    }))
    expect(named.validatedBy).toEqual({ id: 'u1', displayName: 'Arnaud' })
    const unnamed = toAdminMatch(buildMatch({
      validatedBy: { id: 'u2', email: 'admin@example.test', competitor: null } as MatchEntity['validatedBy']
    }))
    expect(unnamed.validatedBy).toEqual({ id: 'u2', displayName: 'admin@example.test' })
  })
})

describe('parseAdminMatchListQuery', () => {
  it('accepts a list of statuses, repeated or comma-separated, including RECORDED', () => {
    expect(parseAdminMatchListQuery({ statut: ['RECORDED', 'SCHEDULED'] }).statuses).toEqual(['RECORDED', 'SCHEDULED'])
    expect(parseAdminMatchListQuery({ statut: 'RECORDED,RECORDED,VALIDATED' }).statuses).toEqual(['RECORDED', 'VALIDATED'])
    expect(parseAdminMatchListQuery({}).statuses).toBeUndefined()
  })

  it('refuses an unknown status, tour or poule with 400', () => {
    for (const query of [{ statut: 'BOGUS' }, { statut: 'RECORDED,BOGUS' }, { tour: 'NOPE' }, { poule: '0' }]) {
      expect(() => parseAdminMatchListQuery(query), JSON.stringify(query)).toThrowError()
    }
  })
})
