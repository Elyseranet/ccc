import { describe, expect, it } from 'vitest'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum'
import type { IAdminDraw, IDrawAssignment } from '../../src/interfaces/draw.interface'
import type { IRandomDrawResult } from '../../src/interfaces/random-draw.interface'
import { drawnCountOf, resetAssignmentsOf, toArrival, toProjectorView } from '../../src/utils/random-draw-view.util'

const assignment = (overrides: Partial<IDrawAssignment>): IDrawAssignment => ({
  participationId: 'p', competitorId: 'c', displayName: 'Nom', poolId: null, poolNumber: null, pairingIndex: null, sidePosition: null, drawnOrder: 1, assignedAt: '2026-11-16T10:00:00.000Z', ...overrides
})

const draw = (kind: DRAW_KIND, assignments: IDrawAssignment[], seedCount = 0): IAdminDraw => ({
  id: 'd1', kind, roundKind: null, status: DRAW_STATUS.DRAFT, parameters: { poolCount: 2, seedCount }, createdAt: '', validatedAt: null, assignments, createdBy: null, validatedBy: null
})

describe('toProjectorView', () => {
  it('pools: one name, its pool, rank without the seeds', () => {
    const drawn = assignment({ participationId: 'p9', displayName: 'Clara David', poolNumber: 7, drawnOrder: 38 })
    const result: IRandomDrawResult = { draw: draw(DRAW_KIND.POOLS, [drawn], 8), step: { assignments: [drawn], remaining: 7 } }
    expect(toProjectorView(DRAW_KIND.POOLS, result, 45)).toEqual({ kind: DRAW_KIND.POOLS, names: ['Clara David'], poolNumber: 7, pairingIndex: null, position: 30, total: 37 })
  })

  it('round: both sides read from the draft, in side order, even when one side was typed by hand', () => {
    const typed = assignment({ participationId: 'a', displayName: 'Lina Mercier', pairingIndex: 4, sidePosition: 1, drawnOrder: 7 })
    const drawn = assignment({ participationId: 'b', displayName: 'Maya Bonnet', pairingIndex: 4, sidePosition: 2, drawnOrder: 8 })
    const other = assignment({ participationId: 'c', displayName: 'Autre', pairingIndex: 1, sidePosition: 1, drawnOrder: 1 })
    const result: IRandomDrawResult = { draw: draw(DRAW_KIND.ROUND, [drawn, other, typed]), step: { assignments: [drawn], remaining: 6 } }
    expect(toProjectorView(DRAW_KIND.ROUND, result, 8)).toEqual({ kind: DRAW_KIND.ROUND, names: ['Lina Mercier', 'Maya Bonnet'], poolNumber: null, pairingIndex: 4, position: 4, total: 8 })
  })
})

describe('toArrival', () => {
  it('keeps the drawn participations, pool and pairing', () => {
    const one = assignment({ participationId: 'x', poolNumber: 3, pairingIndex: 2 })
    expect(toArrival({ draw: draw(DRAW_KIND.POOLS, [one]), step: { assignments: [one], remaining: 0 } })).toEqual({ participationIds: ['x'], poolNumber: 3, pairingIndex: 2 })
  })
})

describe('drawnCountOf', () => {
  it('counts players beyond the seeds in pools and started pairings in a round', () => {
    expect(drawnCountOf(DRAW_KIND.POOLS, draw(DRAW_KIND.POOLS, [assignment({ drawnOrder: 1 }), assignment({ drawnOrder: 2 }), assignment({ drawnOrder: 3 })], 2))).toBe(1)
    expect(drawnCountOf(DRAW_KIND.POOLS, draw(DRAW_KIND.POOLS, [assignment({ drawnOrder: 1 })], 2))).toBe(0)
    expect(drawnCountOf(DRAW_KIND.ROUND, draw(DRAW_KIND.ROUND, [assignment({ pairingIndex: 1, sidePosition: 1 }), assignment({ pairingIndex: 1, sidePosition: 2 }), assignment({ pairingIndex: 2, sidePosition: 1 })]))).toBe(2)
    expect(drawnCountOf(DRAW_KIND.ROUND, null)).toBe(0)
  })
})

describe('resetAssignmentsOf', () => {
  it('keeps only the seeds in pools, with their pool, and nothing in a round', () => {
    const pools = draw(DRAW_KIND.POOLS, [assignment({ participationId: 's1', drawnOrder: 1, poolNumber: 1 }), assignment({ participationId: 's2', drawnOrder: 2, poolNumber: null }), assignment({ participationId: 'o', drawnOrder: 3, poolNumber: 2 })], 2)
    expect(resetAssignmentsOf(DRAW_KIND.POOLS, pools)).toEqual([
      { participationId: 's1', poolNumber: 1, drawnOrder: 1 },
      { participationId: 's2', poolNumber: 2, drawnOrder: 2 }
    ])
    expect(resetAssignmentsOf(DRAW_KIND.ROUND, draw(DRAW_KIND.ROUND, [assignment({ pairingIndex: 1, sidePosition: 1 })]))).toEqual([])
  })
})
