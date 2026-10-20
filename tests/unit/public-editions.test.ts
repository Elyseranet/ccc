import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../shared/enums/match.enum'
import { ROUND_KIND } from '../../shared/enums/round.enum'
import type { MatchEntity } from '../../server/database/entities/match.entity'
import { MATCH_SORT } from '../../server/enums/match-sort.enum'
import { matchesIfNoneMatch } from '../../server/utils/edition/edition-cache.util'
import { parseMatchListQuery } from '../../server/utils/edition/edition-query.util'
import { toPublicMatch, toPublicMatchStatus, toStoredMatchStatuses } from '../../server/utils/match/match-public.mapper.util'

const buildMatch = (status: MATCH_STATUS, scores: [number | null, number | null], recorded: [number, number] = [9, 8]): MatchEntity => ({
  id: 'm1',
  sequence: 1,
  status,
  purpose: MATCH_PURPOSE.REGULAR,
  targetScore: 5,
  comment: 'private comment',
  version: 3,
  round: { kind: ROUND_KIND.POOLS },
  pool: { rank: 2 },
  sides: [0, 1].map((index) => ({
    position: index + 1,
    participationId: `p${index}`,
    recordedScore: recorded[index],
    validatedScore: scores[index],
    participation: { competitorId: `c${index}`, competitor: { displayName: `Player ${index}` } }
  }))
}) as unknown as MatchEntity

describe('toPublicMatch', () => {
  it('serializes RECORDED as SCHEDULED and hides every score', () => {
    const dto = toPublicMatch(buildMatch(MATCH_STATUS.RECORDED, [null, null]))
    expect(dto.status).toBe(MATCH_STATUS.SCHEDULED)
    expect(dto.sides.map((side) => side.score)).toEqual([null, null])
    expect(JSON.stringify(dto)).not.toMatch(/9|8|private|recorded|version/)
  })

  it('publishes the validated score and the winner of a VALIDATED match', () => {
    const dto = toPublicMatch(buildMatch(MATCH_STATUS.VALIDATED, [3, 5]))
    expect(dto.sides.map((side) => side.score)).toEqual([3, 5])
    expect(dto.winnerParticipationId).toBe('p1')
    expect(dto.poolRank).toBe(2)
  })

  it('keeps RESULT_UNKNOWN distinct from SCHEDULED, without score nor winner', () => {
    const dto = toPublicMatch(buildMatch(MATCH_STATUS.RESULT_UNKNOWN, [null, null]))
    expect(dto.status).toBe(MATCH_STATUS.RESULT_UNKNOWN)
    expect(dto.winnerParticipationId).toBeNull()
  })

  it('never reads validatedScore of a match that is not VALIDATED', () => {
    const dto = toPublicMatch(buildMatch(MATCH_STATUS.SCHEDULED, [1, 2]))
    expect(dto.sides.map((side) => side.score)).toEqual([null, null])
  })

  it('maps statuses both ways', () => {
    expect(toPublicMatchStatus(MATCH_STATUS.RECORDED)).toBe(MATCH_STATUS.SCHEDULED)
    expect(toStoredMatchStatuses(MATCH_STATUS.SCHEDULED)).toEqual([MATCH_STATUS.SCHEDULED, MATCH_STATUS.RECORDED])
    expect(toStoredMatchStatuses(MATCH_STATUS.VALIDATED)).toEqual([MATCH_STATUS.VALIDATED])
  })
})

describe('parseMatchListQuery (zod)', () => {
  it('applies pagination defaults and parses filters', () => {
    const query = parseMatchListQuery({ tour: 'POOLS', poule: '3', statut: 'VALIDATED,SCHEDULED', tri: 'validated_at_desc' })
    expect(query).toMatchObject({
      roundKind: ROUND_KIND.POOLS,
      poolRank: 3,
      statuses: [MATCH_STATUS.VALIDATED, MATCH_STATUS.SCHEDULED],
      sort: MATCH_SORT.VALIDATED_AT_DESC,
      pagination: { page: 1, pageSize: 20 }
    })
  })

  it('accepts a repeated statut parameter', () => {
    expect(parseMatchListQuery({ statut: ['VALIDATED', 'RESULT_UNKNOWN'] }).statuses)
      .toEqual([MATCH_STATUS.VALIDATED, MATCH_STATUS.RESULT_UNKNOWN])
  })

  it.each([{ tour: 'FINALE' }, { poule: '1.5' }, { poule: '-1' }, { poule: '' }, { statut: 'RECORDED' }, { statut: '' }, { tri: 'x' }])(
    'rejects %j with VALIDATION_FAILED',
    (query) => {
      expect(() => parseMatchListQuery(query)).toThrow(expect.objectContaining({
        statusCode: 400,
        data: expect.objectContaining({ code: API_ERROR_CODE.VALIDATION_FAILED })
      }))
    }
  )
})

describe('matchesIfNoneMatch', () => {
  const etag = '"ccc-ed-abc"'

  it('matches strong, weak, list and wildcard forms', () => {
    expect(matchesIfNoneMatch(etag, etag)).toBe(true)
    expect(matchesIfNoneMatch(`W/${etag}`, etag)).toBe(true)
    expect(matchesIfNoneMatch(`"other", W/${etag}`, etag)).toBe(true)
    expect(matchesIfNoneMatch('*', etag)).toBe(true)
  })

  it('does not match a different or missing tag', () => {
    expect(matchesIfNoneMatch('"other"', etag)).toBe(false)
    expect(matchesIfNoneMatch(undefined, etag)).toBe(false)
  })
})
