import type { MATCH_PURPOSE, MATCH_STATUS } from '../enums/match.enum.js'

/**
 * A16 : `matches` compte les matchs joués (VALIDATED ou RESULT_UNKNOWN) ; `scoredMatches` ceux qui ont
 * un score (554 sur 729 pour l'archive) ; `unknownResultMatches` le reste (R-5).
 */
export interface IArchiveStats {
  editions: number
  competitors: number
  matches: number
  scoredMatches: number
  unknownResultMatches: number
}

export interface IScoredSide {
  playerId: string
  /** null : score inconnu (match d'archives dont seul le vainqueur est connu, B-21). */
  score: number | null
}

/** Un match vu par les fonctions de domaine : l'ordre des côtés n'encode rien. */
export interface IMatchRecord {
  status: MATCH_STATUS
  purpose: MATCH_PURPOSE
  sides: IScoredSide[]
  /** Vainqueur importé quand les scores sont inconnus (B-21), même clé que `sides[].playerId` ; absent sinon. */
  winnerPlayerId?: string | null
}

export interface IMatchOutcome {
  winner: IScoredSide
  loser: IScoredSide
}

export interface IWinLoss {
  playerId: string
  wins: number
  losses: number
  /** R-5 : matchs REGULAR au résultat inconnu (ni victoire ni défaite). */
  unknownResults: number
}

export interface IPlayerBalance extends IWinLoss {
  played: number
  /** victoires / joués ; null si aucun match avec score. */
  winRatio: number | null
  pointsFor: number
  pointsAgainst: number
  differential: number
}

export interface IHeadToHeadRecord {
  playerAId: string
  playerBId: string
  encounters: number
  winsA: number
  winsB: number
  pointsA: number
  pointsB: number
}
