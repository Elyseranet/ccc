import type { MATCH_PURPOSE, MATCH_STATUS } from '../../shared/enums/match.enum.js'

export interface IScoredSide {
  playerId: string
  score: number
}

/** Un match vu par les fonctions de domaine : l'ordre des côtés n'encode rien. */
export interface IMatchRecord {
  status: MATCH_STATUS
  purpose: MATCH_PURPOSE
  sides: IScoredSide[]
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

export interface IHeadToHead {
  playerAId: string
  playerBId: string
  encounters: number
  winsA: number
  winsB: number
  pointsA: number
  pointsB: number
}
