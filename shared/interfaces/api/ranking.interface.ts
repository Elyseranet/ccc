import type { ICompetitorPublic } from './competitor.interface.js'

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
