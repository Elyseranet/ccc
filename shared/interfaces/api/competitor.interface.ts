import type { EDITION_STATUS } from '../../enums/edition.enum.js'
import type { FINAL_STAGE } from '../../enums/participation.enum.js'

/**
 * Identité publique d'un compétiteur. Ne contient jamais d'email ni de téléphone (invariant 8).
 */
export interface ICompetitorPublic {
  id: string
  displayName: string
  firstName: string | null
  lastName: string | null
  nickname: string | null
  avatarUrl: string | null
}

export interface ICompetitorListItem extends ICompetitorPublic {
  editionsPlayed: number
  matchesPlayed: number
  wins: number
  titles: number
  firstEditionCode: string | null
}

export interface ICompetitorParticipation {
  editionId: string
  editionCode: string
  year: number
  editionName: string | null
  editionStatus: EDITION_STATUS
  finalStage: FINAL_STAGE | null
  points: number | null
  poolRank: number | null
}

export interface ICompetitorStats {
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  titles: number
}

export interface ICompetitorDetail extends ICompetitorPublic {
  participations: ICompetitorParticipation[]
  stats: ICompetitorStats
}
