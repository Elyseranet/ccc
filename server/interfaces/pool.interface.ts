import type { TIEBREAK_FORMAT } from '../enums/domain.enum'

export interface IPoolStandingEntry {
  playerId: string
  rank: number
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  /** Points marqués moins points encaissés (RG19). */
  capsAverage: number
}

/** Égalité non tranchée : un départage doit être joué (A10, A11). */
export interface ITiebreakRequirement {
  playerIds: string[]
  /** Rang (1-based) de la première place disputée. */
  startRank: number
  format: TIEBREAK_FORMAT
}

export interface IPoolStanding {
  entries: IPoolStandingEntry[]
  requiresTiebreak: ITiebreakRequirement[]
}

export interface IQualification {
  /** Les n premiers de chaque poule. */
  topQualifiers: string[]
  /** Les m meilleurs (n+1)èmes. */
  bestNextQualifiers: string[]
  requiresTiebreak: ITiebreakRequirement[]
  /** Places restant à pourvoir parmi une égalité à la frontière, 0 sinon. */
  tiebreakSlots: number
}
