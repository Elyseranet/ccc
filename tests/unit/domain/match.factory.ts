import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import type { IMatchRecord } from '../../../src/server/interfaces/stats.interface'

export function duel(
  a: string,
  scoreA: number,
  b: string,
  scoreB: number,
  overrides: Partial<Pick<IMatchRecord, 'status' | 'purpose'>> = {},
): IMatchRecord {
  return {
    status: MATCH_STATUS.VALIDATED,
    purpose: MATCH_PURPOSE.REGULAR,
    sides: [
      { playerId: a, score: scoreA },
      { playerId: b, score: scoreB },
    ],
    ...overrides,
  }
}

export function tiebreak(...sides: [string, number][]): IMatchRecord {
  return {
    status: MATCH_STATUS.VALIDATED,
    purpose: MATCH_PURPOSE.TIEBREAK,
    sides: sides.map(([playerId, score]) => ({ playerId, score })),
  }
}
