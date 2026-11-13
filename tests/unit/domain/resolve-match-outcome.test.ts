import { describe, expect, it } from 'vitest'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import type { IMatchRecord } from '../../../src/interfaces/stats.interface'
import { computeHeadToHead, computePlayerBalance, resolveMatchOutcome } from '../../../src/utils/record.util'

const record = (a: number | null, b: number | null, winnerPlayerId?: string | null): IMatchRecord => ({
  status: MATCH_STATUS.VALIDATED,
  purpose: MATCH_PURPOSE.REGULAR,
  sides: [{ playerId: 'A', score: a }, { playerId: 'B', score: b }],
  winnerPlayerId
})

describe('resolveMatchOutcome with an imported winner (B-21)', () => {
  it('takes the winner from the scores when they exist', () => {
    expect(resolveMatchOutcome(record(3, 5)).winner.playerId).toBe('B')
  })

  it('takes the winner from winnerPlayerId when the scores are unknown', () => {
    const outcome = resolveMatchOutcome(record(null, null, 'B'))
    expect(outcome.winner.playerId).toBe('B')
    expect(outcome.loser.playerId).toBe('A')
  })

  it('accepts scores and an imported winner that agree', () => {
    expect(resolveMatchOutcome(record(5, 2, 'A')).winner.playerId).toBe('A')
  })

  it('throws when the scores and the imported winner contradict each other', () => {
    expect(() => resolveMatchOutcome(record(5, 2, 'B'))).toThrow(/contredit/)
  })

  it('throws with neither a usable score nor a winner, with equal scores and no winner, or with a winner outside the sides', () => {
    expect(() => resolveMatchOutcome(record(null, null))).toThrow(/sans vainqueur/)
    expect(() => resolveMatchOutcome(record(4, 4))).toThrow(/sans vainqueur/)
    expect(() => resolveMatchOutcome(record(null, null, 'C'))).toThrow(/pas l’un des côtés/)
  })

  it('counts a winner-only match as a win and a loss but never in the points', () => {
    const matches = [record(null, null, 'A'), record(5, 2, 'A')]
    const [a, b] = ['A', 'B'].map((playerId) => computePlayerBalance(matches).find((row) => row.playerId === playerId)!)
    expect(a).toMatchObject({ wins: 2, losses: 0, played: 2, pointsFor: 5, pointsAgainst: 2, unknownResults: 0 })
    expect(b).toMatchObject({ wins: 0, losses: 2, played: 2, pointsFor: 2, pointsAgainst: 5 })
    expect(computeHeadToHead(matches, 'A', 'B')).toMatchObject({ encounters: 2, winsA: 2, winsB: 0, pointsA: 5, pointsB: 2 })
  })
})
