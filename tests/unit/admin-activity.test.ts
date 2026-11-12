import { describe, expect, it } from 'vitest'
import { ADMIN_ACTIVITY_KIND, ADMIN_ACTIVITY_TARGET } from '../../src/enums/admin-activity.enum'
import { DRAW_KIND } from '../../src/enums/draw.enum'
import { MATCH_STATUS } from '../../src/enums/match.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import type { IAdminActivityItem } from '../../src/interfaces/admin-activity.interface'
import { adminActivityQuerySchema } from '../../src/server/schemas/admin-activity.schema'
import {
  compareActivity,
  toDrawCreatedActivity,
  toDrawValidatedActivity,
  toMatchActivity
} from '../../src/utils/admin-activity.mapper.util'

const user = { id: 'u1', email: 'admin@ccc.test', competitor: { displayName: 'Admin Dupont' } }
const draw = (overrides: Record<string, unknown> = {}) => ({
  id: 'd1',
  kind: DRAW_KIND.POOLS,
  round: null,
  parameters: { poolCount: 4, seedCount: 4, extra: 'ignored' },
  createdAt: new Date('2027-01-01T10:00:00Z'),
  validatedAt: new Date('2027-01-01T11:00:00Z'),
  createdBy: user,
  validatedBy: null,
  ...overrides
})
const match = {
  id: 'm1',
  sequence: 7,
  status: MATCH_STATUS.VALIDATED,
  purpose: 'REGULAR',
  targetScore: 5,
  validatedAt: new Date('2027-01-01T12:00:00Z'),
  validatedBy: user,
  round: { kind: ROUND_KIND.POOLS },
  pool: { rank: 2 },
  sides: [
    { participationId: 'p2', position: 2, validatedScore: 1, participation: { competitorId: 'c2', competitor: { displayName: 'B' } } },
    { participationId: 'p1', position: 1, validatedScore: 5, participation: { competitorId: 'c1', competitor: { displayName: 'A' } } }
  ]
}

describe('admin activity mapping (B-15)', () => {
  it('maps a validated match with its sides in position order and its author', () => {
    expect(toMatchActivity(match as never)).toEqual({
      kind: ADMIN_ACTIVITY_KIND.MATCH_VALIDATED,
      at: '2027-01-01T12:00:00.000Z',
      actor: { id: 'u1', displayName: 'Admin Dupont' },
      target: {
        type: ADMIN_ACTIVITY_TARGET.MATCH,
        id: 'm1',
        matchSequence: 7,
        roundKind: ROUND_KIND.POOLS,
        poolNumber: 2,
        sides: [
          { participationId: 'p1', competitorId: 'c1', displayName: 'A', score: 5 },
          { participationId: 'p2', competitorId: 'c2', displayName: 'B', score: 1 }
        ]
      }
    })
  })

  it('maps draw creation and validation, exposing only whitelisted parameters', () => {
    const created = toDrawCreatedActivity(draw() as never)
    expect(created).toMatchObject({
      kind: ADMIN_ACTIVITY_KIND.DRAW_CREATED,
      at: '2027-01-01T10:00:00.000Z',
      actor: { id: 'u1', displayName: 'Admin Dupont' },
      target: { type: ADMIN_ACTIVITY_TARGET.DRAW, id: 'd1', drawKind: DRAW_KIND.POOLS, roundKind: null, poolCount: 4, seedCount: 4 }
    })
    expect(JSON.stringify(created)).not.toContain('extra')
    const validated = toDrawValidatedActivity(draw() as never)
    expect(validated).toMatchObject({ kind: ADMIN_ACTIVITY_KIND.DRAW_VALIDATED, at: '2027-01-01T11:00:00.000Z', actor: null })
  })

  it('leaves the pool counts null for a round draw', () => {
    const item = toDrawCreatedActivity(draw({ kind: DRAW_KIND.ROUND, round: { kind: ROUND_KIND.QUARTER } }) as never)
    expect(item.target).toMatchObject({ drawKind: DRAW_KIND.ROUND, roundKind: ROUND_KIND.QUARTER, poolCount: null, seedCount: null })
  })

  it('sorts most recent first, with a stable tie-break on the target id then the kind', () => {
    const item = (at: string, id: string, kind = ADMIN_ACTIVITY_KIND.DRAW_CREATED): IAdminActivityItem => ({
      kind, at, actor: null, target: { type: ADMIN_ACTIVITY_TARGET.DRAW, id, drawKind: DRAW_KIND.POOLS, roundKind: null, poolCount: 1, seedCount: 1 }
    })
    const items = [
      item('2027-01-01T10:00:00.000Z', 'a'),
      item('2027-01-01T12:00:00.000Z', 'b'),
      item('2027-01-01T11:00:00.000Z', 'z'),
      item('2027-01-01T11:00:00.000Z', 'c', ADMIN_ACTIVITY_KIND.DRAW_VALIDATED),
      item('2027-01-01T11:00:00.000Z', 'c')
    ]
    const sorted = [...items].sort(compareActivity)
    expect(sorted.map((entry) => [entry.target.id, entry.kind])).toEqual([
      ['b', ADMIN_ACTIVITY_KIND.DRAW_CREATED],
      ['c', ADMIN_ACTIVITY_KIND.DRAW_CREATED],
      ['c', ADMIN_ACTIVITY_KIND.DRAW_VALIDATED],
      ['z', ADMIN_ACTIVITY_KIND.DRAW_CREATED],
      ['a', ADMIN_ACTIVITY_KIND.DRAW_CREATED]
    ])
    expect([...items].reverse().sort(compareActivity)).toEqual(sorted)
  })
})

describe('adminActivityQuerySchema', () => {
  it('defaults limit to 20 and accepts 1 to 100', () => {
    expect(adminActivityQuerySchema.parse({})).toEqual({ limit: 20 })
    expect(adminActivityQuerySchema.parse({ limit: '1' })).toEqual({ limit: 1 })
    expect(adminActivityQuerySchema.parse({ limit: '100' })).toEqual({ limit: 100 })
  })

  it.each(['0', '101', '-1', 'abc', '1.5', '', '1e1', ' 5'])('rejects limit=%j', (limit) => {
    expect(adminActivityQuerySchema.safeParse({ limit }).success).toBe(false)
  })

  it('rejects an unknown parameter', () => {
    expect(adminActivityQuerySchema.safeParse({ offset: '1' }).success).toBe(false)
  })
})
