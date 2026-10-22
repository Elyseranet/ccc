import type { ROUND_KIND } from '../enums/round.enum.js'
import type { ICompetitorPublic, ICompetitorWithTitles } from './competitor.interface.js'

/**
 * Bilan d'une paire de joueurs, vu du côté de `competitor` (RG36, RG37).
 */
export interface IHeadToHeadSummary {
  competitor: ICompetitorPublic
  opponent: ICompetitorWithTitles
  /** Matchs de la paire avec score (R-5). */
  played: number
  wins: number
  losses: number
  /** R-5 : matchs REGULAR de la paire au résultat inconnu ; ni victoire ni défaite, hors `played`. */
  unknownResults: number
  winRatio: number | null
  pointsFor: number
  pointsAgainst: number
  differential: number
}

export interface IHeadToHeadMatch {
  matchId: string
  editionId: string
  editionCode: string
  roundKind: ROUND_KIND
  /** Numéro de la poule du match (1-based) ; null hors poule. */
  poolNumber: number | null
  competitorScore: number
  opponentScore: number
  winnerCompetitorId: string
}

export interface IHeadToHead extends IHeadToHeadSummary {
  matches: IHeadToHeadMatch[]
}
