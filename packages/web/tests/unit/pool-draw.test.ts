import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum'
import type { ISeedCandidate } from '../../src/interfaces/draw.interface'
import { createPoolDrawSchema, seedProposalQuerySchema, updateDrawAssignmentsSchema } from '../../src/server/schemas/draw.schema'
import { toAdminDraw, toPublicDraw } from '../../src/utils/draw-public.mapper.util'
import { boundaryTies, competitionRank, isValidSeedSelection, rankSeedCandidates } from '../../src/utils/seeding.util'

const candidate = (playerId: string, overrides: Partial<ISeedCandidate> = {}): ISeedCandidate => ({
  playerId, acp: 0, titles: 0, finals: 0, semis: 0, quarters: 0, roundsOf16: 0, playoffs: 0, participations: 1, ...overrides
})
const UUID = '00000000-0000-4000-8000-000000000001'

describe('isValidSeedSelection (RG9, RG10)', () => {
  const ranked = rankSeedCandidates([
    candidate('top', { acp: 90 }),
    candidate('tie-1', { acp: 30 }),
    candidate('tie-2', { acp: 30 }),
    candidate('last', { acp: 5 })
  ]).ranked

  it('accepts the top of the ranking', () => {
    expect(isValidSeedSelection(ranked, new Set(['top', 'tie-1']))).toBe(true)
  })

  it('accepts either member of a perfect tie on the frontier (the administrator chooses)', () => {
    expect(isValidSeedSelection(ranked, new Set(['top', 'tie-2']))).toBe(true)
  })

  it('refuses a candidate that is strictly worse than one left out', () => {
    expect(isValidSeedSelection(ranked, new Set(['top', 'last']))).toBe(false)
  })

  it('refuses an identifier that is not a candidate', () => {
    expect(isValidSeedSelection(ranked, new Set(['top', 'stranger']))).toBe(false)
  })
})

describe('boundaryTies and competitionRank', () => {
  const ranking = rankSeedCandidates([
    candidate('top', { acp: 90 }),
    candidate('tie-1', { acp: 30 }),
    candidate('tie-2', { acp: 30 }),
    candidate('mid-a', { acp: 10 }),
    candidate('mid-b', { acp: 10 })
  ])

  it('reports only the ties that straddle the frontier', () => {
    expect(boundaryTies(ranking, 2)).toEqual([['tie-1', 'tie-2']])
    expect(boundaryTies(ranking, 3)).toEqual([])
    expect(boundaryTies(ranking, 4)).toEqual([['mid-a', 'mid-b']])
  })

  it('gives tied candidates the same competition rank', () => {
    expect(ranking.ranked.map((entry) => competitionRank(ranking.ranked, entry))).toEqual([1, 2, 2, 4, 4])
  })
})

describe('draw schemas', () => {
  it('parses poules as a bounded positive integer', () => {
    expect(seedProposalQuerySchema.parse({ poules: '4' })).toEqual({ poules: 4 })
    for (const poules of ['0', '-1', '1.5', 'abc', '1e2', '21', '']) {
      expect(seedProposalQuerySchema.safeParse({ poules }).success).toBe(false)
    }
  })

  it('refuses unknown fields and out-of-range counts when creating a draw', () => {
    expect(createPoolDrawSchema.safeParse({ poolCount: 2, seedCount: 2, seeds: [UUID, UUID] }).success).toBe(true)
    expect(createPoolDrawSchema.safeParse({ poolCount: 0, seedCount: 0, seeds: [] }).success).toBe(false)
    expect(createPoolDrawSchema.safeParse({ poolCount: 21, seedCount: 21, seeds: [UUID] }).success).toBe(false)
    expect(createPoolDrawSchema.safeParse({ poolCount: 2, seedCount: 2, seeds: [UUID], extra: 1 }).success).toBe(false)
  })

  it('bounds the list of assignments and refuses poolRank (the contract says poolNumber)', () => {
    const assignment = { participationId: UUID, poolNumber: 1, drawnOrder: 1 }
    expect(updateDrawAssignmentsSchema.safeParse({ assignments: [assignment] }).success).toBe(true)
    expect(updateDrawAssignmentsSchema.safeParse({ assignments: [{ ...assignment, poolRank: 1 }] }).success).toBe(false)
    expect(updateDrawAssignmentsSchema.safeParse({ assignments: Array.from({ length: 201 }, () => assignment) }).success).toBe(false)
  })
})

describe('draw mappers', () => {
  const draw = {
    id: 'draw', kind: DRAW_KIND.POOLS, status: DRAW_STATUS.DRAFT, round: null, parameters: { poolCount: 2, seedCount: 2 },
    createdAt: new Date('2026-10-28T10:00:00Z'), validatedAt: null,
    createdBy: { id: 'u1', email: 'admin@ccc.test', competitor: { displayName: 'Admin Dupont' } }, validatedBy: null
  }
  const assignment = (overrides: Record<string, unknown>) => ({
    participationId: 'p', poolId: null, poolNumber: null, pool: null, pairingIndex: null, sidePosition: null, drawnOrder: 1,
    assignedAt: new Date('2026-10-28T10:01:00Z'), participation: { competitorId: 'c', competitor: { displayName: 'Joueur' } },
    ...overrides
  })

  it('reads the draft pool number, then falls back on the pool rank (archived draws have no pool_number)', () => {
    const result = toPublicDraw(draw as never, [
      assignment({ poolNumber: 3 }),
      assignment({ drawnOrder: 2, pool: { rank: 5 } }),
      assignment({ drawnOrder: 3, poolNumber: 2, pool: { rank: 4 } }),
      assignment({ drawnOrder: 4 })
    ] as never)
    expect(result.assignments.map((entry) => entry.poolNumber)).toEqual([3, 5, 2, null])
  })

  it('adds the actors to the admin DTO only', () => {
    expect(toAdminDraw(draw as never, []).createdBy).toEqual({ id: 'u1', displayName: 'Admin Dupont' })
    expect(toAdminDraw(draw as never, []).validatedBy).toBeNull()
    expect(toPublicDraw(draw as never, [])).not.toHaveProperty('createdBy')
  })
})

describe('A1, RG12 : aucune source d\'aléa dans le tirage', () => {
  it.each(['src/services/draw.service.ts', 'src/utils/seeding.util.ts', 'src/utils/round-robin.util.ts', 'src/utils/draw-public.mapper.util.ts'])(
    '%s ne tire rien au sort', (file) => {
      expect(readFileSync(file, 'utf8')).not.toMatch(/Math\.random|randomInt|randomBytes|randomUUID|getRandomValues|crypto\.random|ORDER BY random|shuffle/i)
    }
  )
})
