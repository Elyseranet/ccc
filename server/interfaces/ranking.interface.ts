import type { EDITION_STATUS } from '../../shared/enums/edition.enum'
import type { FINAL_STAGE } from '../../shared/enums/participation.enum'

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
