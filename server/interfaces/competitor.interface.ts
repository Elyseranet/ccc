import type { MatchEntity } from '../database/entities/match.entity'
import type { IMatchRecord } from './stats.interface'
import type { COMPETITOR_SORT, SORT_ORDER } from '../enums/competitor-sort.enum'

/** Parcours d'un compétiteur dans les éditions (hors matchs). */
export interface ICompetitorCareer {
  competitorId: string
  editionsPlayed: number
  titles: number
  firstEditionCode: string | null
  firstEditionRank: number | null
}

export interface ICompetitorListQuery {
  q?: string
  edition?: string
  sort: COMPETITOR_SORT
  order: SORT_ORDER
  page: number
  pageSize: number
}

/** Un match chargé et sa version IMatchRecord (clé : compétiteur). */
export interface IMatchContext {
  match: MatchEntity
  record: IMatchRecord
}
