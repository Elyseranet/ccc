import type { MATCH_PURPOSE, MATCH_STATUS } from '../../shared/enums/match.enum'

export interface IMatchSide {
  playerId: string
  score: number
}

/** Un match vu par les fonctions de domaine : l'ordre des côtés n'encode rien. */
export interface IMatchRecord {
  status: MATCH_STATUS
  purpose: MATCH_PURPOSE
  sides: IMatchSide[]
}

export interface IMatchOutcome {
  winner: IMatchSide
  loser: IMatchSide
}

export interface IWinLoss {
  playerId: string
  wins: number
  losses: number
}

export interface IPlayerBalance extends IWinLoss {
  played: number
  /** victoires / joués ; un joueur n'apparaît qu'avec au moins un match. */
  winRatio: number
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
