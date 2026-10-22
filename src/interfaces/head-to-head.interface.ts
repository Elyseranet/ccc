import type { ROUND_KIND } from '../enums/round.enum'
import type { ICompetitorPublic } from './competitor.interface'

/**
 * Bilan d'une paire de joueurs, vu du côté de `competitor` (RG36, RG37).
 */
export interface IHeadToHeadSummary {
  competitor: ICompetitorPublic
  opponent: ICompetitorPublic
  played: number
  wins: number
  losses: number
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
  competitorScore: number
  opponentScore: number
  winnerCompetitorId: string
}

export interface IHeadToHead extends IHeadToHeadSummary {
  matches: IHeadToHeadMatch[]
}
