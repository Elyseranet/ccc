import { describe, expect, it } from 'vitest'
import type { CompetitorEntity } from '../../server/database/entities/competitor.entity'
import type { MatchEntity } from '../../server/database/entities/match.entity'
import { MATCH_RECORD_KEY } from '../../server/enums/match-record-key.enum'
import { toCompetitorPublic } from '../../server/utils/competitor/competitor-public.mapper.util'
import { toMatchRecord } from '../../server/utils/match/match-record.mapper.util'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../shared/enums/match.enum'

describe('toCompetitorPublic', () => {
  it('exposes only whitelisted fields, even when the entity carries private data', () => {
    const entity = {
      id: 'c1',
      displayName: 'Rémi',
      firstName: 'Rémi',
      lastName: 'D',
      nickname: null,
      avatarUrl: null,
      phone: '0600000000',
      email: 'remi@example.com',
      passwordHash: 'x',
      createdAt: new Date()
    } as unknown as CompetitorEntity
    const result = toCompetitorPublic(entity)
    expect(Object.keys(result).sort()).toEqual(['avatarUrl', 'displayName', 'firstName', 'id', 'lastName', 'nickname'])
    expect(JSON.stringify(result)).not.toMatch(/0600000000|example\.com|passwordHash/)
  })
})

const side = (participationId: string, competitorId: string, validatedScore: number | null, recordedScore: number | null = 99) => ({
  participationId,
  validatedScore,
  recordedScore,
  participation: { competitorId }
})

const match = (status: MATCH_STATUS, sides: ReturnType<typeof side>[]) =>
  ({ status, purpose: MATCH_PURPOSE.REGULAR, sides }) as unknown as MatchEntity

describe('toMatchRecord', () => {
  const validated = match(MATCH_STATUS.VALIDATED, [side('p1', 'c1', 5), side('p2', 'c2', 3)])

  it('reads validated_score only, never recorded_score', () => {
    expect(toMatchRecord(validated, MATCH_RECORD_KEY.PARTICIPATION).sides.map((s) => s.score)).toEqual([5, 3])
  })

  it('keys sides by participation id', () => {
    expect(toMatchRecord(validated, MATCH_RECORD_KEY.PARTICIPATION).sides.map((s) => s.playerId)).toEqual(['p1', 'p2'])
  })

  it('keys sides by competitor id', () => {
    expect(toMatchRecord(validated, MATCH_RECORD_KEY.COMPETITOR).sides.map((s) => s.playerId)).toEqual(['c1', 'c2'])
  })

  it('accepts a result-unknown match without scores', () => {
    const unknown = match(MATCH_STATUS.RESULT_UNKNOWN, [side('p1', 'c1', null), side('p2', 'c2', null)])
    const record = toMatchRecord(unknown, MATCH_RECORD_KEY.COMPETITOR)
    expect(record.status).toBe(MATCH_STATUS.RESULT_UNKNOWN)
  })

  it('rejects a validated match without validated score', () => {
    const broken = match(MATCH_STATUS.VALIDATED, [side('p1', 'c1', null), side('p2', 'c2', 3)])
    expect(() => toMatchRecord(broken, MATCH_RECORD_KEY.COMPETITOR)).toThrow()
  })
})
