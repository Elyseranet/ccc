import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { TIEBREAK_FORMAT } from '../../../src/enums/domain.enum'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { QUALIFICATION_ROUTE, TIEBREAK_SCOPE } from '../../../src/enums/qualification.enum'
import { ROUND_KIND } from '../../../src/enums/round.enum'
import type { IRoundDrawAssignmentInput } from '../../../src/interfaces/qualification.interface'
import { checkRoundDrawAssignments, computeQualification, planRoundDraw, sameMembers } from '../../../src/utils/qualification-plan.util'
import { duel, tiebreak } from './match.factory'

/** Une poule de 3 joueurs x1 > x2 > x3 (x1 bat tout le monde, x2 bat x3) ; `loserScore` et `lastScore` règlent les écarts (donc le cap's average). */
const pool = (id: string, [x1, x2, x3]: [string, string, string], loserScore = 3, lastScore = loserScore) => ({
  pool: { poolId: id, memberIds: [x1, x2, x3] },
  records: [duel(x1, 5, x2, loserScore), duel(x1, 5, x3, loserScore), duel(x2, 5, x3, lastScore)]
})

describe('computeQualification (RG18 à RG20, A10)', () => {
  const p1 = pool('P1', ['a1', 'a2', 'a3'], 3)
  const p2 = pool('P2', ['b1', 'b2', 'b3'], 3, 0)
  const pools = [p1.pool, p2.pool]
  const records = [...p1.records, ...p2.records]

  it('without parameters it only reports the standings and the pool ties', () => {
    const result = computeQualification(pools, records, null)
    expect(result.standings).toHaveLength(2)
    expect(result.qualified).toBeNull()
    expect(result.blockingTies).toEqual([])
  })

  it('selects the n first of each pool and the m best (n+1)th, with the pool and the place of each', () => {
    const result = computeQualification(pools, records, { topPerPool: 1, bestNextCount: 1 })
    expect(result.blockingTies).toEqual([])
    const top = result.qualified!.filter((entry) => entry.route === QUALIFICATION_ROUTE.TOP_OF_POOL)
    expect(top.map((entry) => [entry.playerId, entry.poolId, entry.poolRank])).toEqual([['a1', 'P1', 1], ['b1', 'P2', 1]])
    expect(result.qualified!.filter((entry) => entry.route === QUALIFICATION_ROUTE.BEST_NEXT)).toHaveLength(1)
  })

  it('reports a pool tie that touches the frontier as blocking, scoped to its pool', () => {
    // Trois joueurs à une victoire chacun : cycle a>b, b>c, c>a, mêmes scores donc même cap's average.
    const cycle = [duel('c1', 5, 'c2', 3), duel('c2', 5, 'c3', 3), duel('c3', 5, 'c1', 3)]
    const result = computeQualification([{ poolId: 'PC', memberIds: ['c1', 'c2', 'c3'] }], cycle, { topPerPool: 1, bestNextCount: 0 })
    expect(result.qualified).toEqual([])
    expect(result.blockingTies).toHaveLength(1)
    expect(result.blockingTies[0]).toMatchObject({
      scope: TIEBREAK_SCOPE.POOL, poolId: 'PC', startRank: 1, format: TIEBREAK_FORMAT.MULTI_SIDES, slots: 0
    })
    expect(sameMembers(result.blockingTies[0]!.playerIds, ['c1', 'c2', 'c3'])).toBe(true)
  })

  it('a validated three-sided tiebreak closes the tie: the winner takes the place, the two losers stay tied (R-2)', () => {
    const cycle = [duel('c1', 5, 'c2', 3), duel('c2', 5, 'c3', 3), duel('c3', 5, 'c1', 3)]
    const decided = [...cycle, tiebreak(['c1', 1], ['c2', 3], ['c3', 0])]
    const result = computeQualification([{ poolId: 'PC', memberIds: ['c1', 'c2', 'c3'] }], decided, { topPerPool: 1, bestNextCount: 0 })
    expect(result.blockingTies).toEqual([])
    expect(result.qualified!.map((entry) => entry.playerId)).toEqual(['c2'])
  })

  it('R-7: four players tied for two best-next places need a 4-sided tiebreak, then a 3-sided one between its losers', () => {
    const fourPools = ['1', '2', '3', '4'].map((n) => pool(`P${n}`, [`x${n}1`, `x${n}2`, `x${n}3`]))
    const pools4 = fourPools.map((entry) => entry.pool)
    const base = fourPools.flatMap((entry) => entry.records)
    const parameters = { topPerPool: 1, bestNextCount: 2 }
    const second = ['x12', 'x22', 'x32', 'x42']

    const first = computeQualification(pools4, base, parameters)
    expect(first.blockingTies).toHaveLength(1)
    expect(first.blockingTies[0]).toMatchObject({ scope: TIEBREAK_SCOPE.BOUNDARY, poolId: null, format: TIEBREAK_FORMAT.MULTI_SIDES, slots: 2 })
    expect(sameMembers(first.blockingTies[0]!.playerIds, second)).toBe(true)

    // Le 4 côtés : x12 gagne ; les trois autres perdants restent ex aequo (R-2) pour la place restante.
    const afterFour = [...base, tiebreak(['x12', 3], ['x22', 1], ['x32', 2], ['x42', 0])]
    const next = computeQualification(pools4, afterFour, parameters)
    expect(next.blockingTies).toHaveLength(1)
    expect(sameMembers(next.blockingTies[0]!.playerIds, ['x22', 'x32', 'x42'])).toBe(true)
    expect(next.blockingTies[0]!.slots).toBe(1)

    const afterThree = [...afterFour, tiebreak(['x32', 3], ['x22', 1], ['x42', 0])]
    const done = computeQualification(pools4, afterThree, parameters)
    expect(done.blockingTies).toEqual([])
    const best = done.qualified!.filter((entry) => entry.route === QUALIFICATION_ROUTE.BEST_NEXT).map((entry) => entry.playerId)
    expect(best.sort()).toEqual(['x12', 'x32'])
  })
})

describe('planRoundDraw (RG13, RG14)', () => {
  const finalized = { editionStatus: EDITION_STATUS.QUALIFIED, qualification: { topPerPool: 2, bestNextCount: 0, withPlayoff: false } }

  it('is blocked by QUALIFICATION_NOT_DONE until the list is finalized', () => {
    expect(planRoundDraw({ editionStatus: EDITION_STATUS.POOLS_DRAWN, qualification: null, knockoutRounds: [], candidateCount: 8 }))
      .toEqual({ roundKind: null, blockedBy: API_ERROR_CODE.QUALIFICATION_NOT_DONE })
  })

  it.each([[16, ROUND_KIND.ROUND_OF_16], [8, ROUND_KIND.QUARTER], [4, ROUND_KIND.SEMI], [2, ROUND_KIND.FINAL]])(
    'deduces the round from the pool size: %i -> %s', (candidateCount, roundKind) => {
      expect(planRoundDraw({ ...finalized, knockoutRounds: [], candidateCount })).toEqual({ roundKind, blockedBy: null })
    })

  it('answers no round for a size outside 2, 4, 8, 16 (Q2: no power-of-two check at qualification, none here either)', () => {
    expect(planRoundDraw({ ...finalized, knockoutRounds: [], candidateCount: 12 })).toEqual({ roundKind: null, blockedBy: null })
  })

  it('draws the playoff first when the qualification has withPlayoff, whatever the pool size', () => {
    expect(planRoundDraw({
      editionStatus: EDITION_STATUS.QUALIFIED,
      qualification: { topPerPool: 3, bestNextCount: 2, withPlayoff: true },
      knockoutRounds: [],
      candidateCount: 22
    })).toEqual({ roundKind: ROUND_KIND.PLAYOFF, blockedBy: null })
  })

  it('is blocked by ROUND_NOT_COMPLETED while the last round has a match to validate (RG13)', () => {
    expect(planRoundDraw({ ...finalized, editionStatus: EDITION_STATUS.PLAYOFFS, knockoutRounds: [{ kind: ROUND_KIND.QUARTER, completed: false }], candidateCount: 4 }))
      .toEqual({ roundKind: null, blockedBy: API_ERROR_CODE.ROUND_NOT_COMPLETED })
  })

  it('follows the playoff with the round of 16 once the playoff is complete', () => {
    expect(planRoundDraw({
      editionStatus: EDITION_STATUS.PLAYOFFS,
      qualification: { topPerPool: 3, bestNextCount: 2, withPlayoff: true },
      knockoutRounds: [{ kind: ROUND_KIND.PLAYOFF, completed: true }],
      candidateCount: 16
    })).toEqual({ roundKind: ROUND_KIND.ROUND_OF_16, blockedBy: null })
  })

  it('draws nothing after the final', () => {
    expect(planRoundDraw({ ...finalized, editionStatus: EDITION_STATUS.PLAYOFFS, knockoutRounds: [{ kind: ROUND_KIND.FINAL, completed: true }], candidateCount: 1 }))
      .toEqual({ roundKind: null, blockedBy: null })
  })
})

describe('checkRoundDrawAssignments (A1)', () => {
  const candidates = ['p1', 'p2', 'p3', 'p4']
  const pair = (participationId: string, pairingIndex: number, sidePosition: 1 | 2, drawnOrder: number): IRoundDrawAssignmentInput =>
    ({ participationId, pairingIndex, sidePosition, drawnOrder })
  const full = [pair('p1', 1, 1, 1), pair('p4', 1, 2, 2), pair('p2', 2, 1, 3), pair('p3', 2, 2, 4)]
  const check = (assignments: IRoundDrawAssignmentInput[], extra: { roundKind?: ROUND_KIND, complete?: boolean, winners?: string[], ids?: string[] } = {}) =>
    checkRoundDrawAssignments({
      assignments,
      candidateIds: extra.ids ?? candidates,
      roundKind: extra.roundKind ?? ROUND_KIND.SEMI,
      poolWinnerIds: extra.winners ?? [],
      complete: extra.complete ?? true
    })

  it('accepts a complete draw', () => {
    expect(check(full)).toBeNull()
  })

  it('refuses a stranger, a duplicate player, a duplicate order and a duplicate side', () => {
    expect(check([pair('x', 1, 1, 1), ...full.slice(1)])).not.toBeNull()
    expect(check([pair('p1', 1, 1, 1), pair('p1', 1, 2, 2)])).not.toBeNull()
    expect(check([pair('p1', 1, 1, 1), pair('p2', 1, 2, 1)])).not.toBeNull()
    expect(check([pair('p1', 1, 1, 1), pair('p2', 1, 1, 2)])).not.toBeNull()
  })

  it('a draft may be partial, a validation may not: every pairing has two players and everyone is drawn', () => {
    const half = [pair('p1', 1, 1, 1)]
    expect(check(half, { complete: false })).toBeNull()
    expect(check(half)).not.toBeNull()
    expect(check(full.slice(0, 2))).not.toBeNull()
  })

  it('pairings are numbered from 1 without a gap', () => {
    expect(check([pair('p1', 2, 1, 1), pair('p2', 2, 2, 2), pair('p3', 3, 1, 3), pair('p4', 3, 2, 4)])).not.toBeNull()
  })

  it('the playoff only draws some players, and never a pool winner (RG14)', () => {
    const playoff = [pair('p2', 1, 1, 1), pair('p3', 1, 2, 2)]
    expect(check(playoff, { roundKind: ROUND_KIND.PLAYOFF, winners: ['p1'] })).toBeNull()
    expect(check([pair('p1', 1, 1, 1), pair('p3', 1, 2, 2)], { roundKind: ROUND_KIND.PLAYOFF, winners: ['p1'], complete: false })).not.toBeNull()
  })
})
