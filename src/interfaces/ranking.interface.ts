import type { ICompetitorPublic } from './competitor.interface'
import type { EDITION_STATUS } from '../enums/edition.enum'
import type { FINAL_STAGE } from '../enums/participation.enum'

export interface IRankingRow {
  rank: number
  competitor: ICompetitorPublic
  points: number
  participations: number
  average: number
  titles: number
}

/**
 * Valeur et rang d'un compétiteur après une édition (RG8).
 */
export interface IRankingEvolutionPoint {
  editionId: string
  editionCode: string
  year: number
  points: number
  rank: number | null
}

export interface IRankingEvolutionSeries {
  competitor: ICompetitorPublic
  points: IRankingEvolutionPoint[]
}

export interface IRankingEdition {
  id: string
  /** Ordre chronologique des éditions (2012a < 2012b < 2013 ...). */
  chronologicalRank: number
  status: EDITION_STATUS
}

/** Une participation qui a des points (y compris 0), RG5. */
export interface IScoredParticipation {
  playerId: string
  editionId: string
  points: number
}

export interface IStagedParticipation {
  playerId: string
  editionId: string
  finalStage: FINAL_STAGE
}

export interface IPlayerScore {
  playerId: string
  total: number
  /** Rang « compétition » : les ex aequo partagent le même rang. */
  rank: number
}

export interface IPlayerAverage {
  playerId: string
  participations: number
  total: number
  average: number
}

export interface IPlayerTitles {
  playerId: string
  titles: number
}

export interface IEvolutionEntry {
  playerId: string
  acp: number
  allTime: number
  acpRank: number
  allTimeRank: number
}

export interface IEditionEvolution {
  editionId: string
  chronologicalRank: number
  entries: IEvolutionEntry[]
}

/** Édition telle que la lecture publique des classements en a besoin (évolution : code et année). */
export interface IRankingEditionInfo extends IRankingEdition {
  code: string
  year: number
}

/** Participation brute lue en base : `points` est null tant que l'issue est inconnue (B-04) ou l'édition non clôturée. */
export interface IRankingSourceParticipation {
  playerId: string
  editionId: string
  points: number | null
  finalStage: FINAL_STAGE | null
}

/** Tout ce que la lecture publique des classements charge en base. */
export interface IRankingSource {
  competitors: Map<string, ICompetitorPublic>
  editions: IRankingEditionInfo[]
  participations: IRankingSourceParticipation[]
}
