import type { PARTICIPATION_STATUS } from '../enums/participation.enum.js'
import type { ICompetitorPublic } from './competitor.interface.js'
import type { TIEBREAK_FORMAT } from '../enums/domain.enum.js'

export interface IPoolStandingRow {
  rank: number
  participationId: string
  competitor: ICompetitorPublic
  isSeed: boolean
  participationStatus: PARTICIPATION_STATUS
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  /** Cap's average : points marqués moins points encaissés (RG19). */
  capsAverage: number
  /** R-5 : matchs REGULAR au résultat inconnu, exclus de played, wins et losses. */
  unknownResults: number
}

export interface IPool {
  id: string
  rank: number
  standing: IPoolStandingRow[]
}

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

