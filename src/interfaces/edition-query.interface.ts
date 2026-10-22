import type { MATCH_STATUS } from '../enums/match.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { MATCH_SORT } from '../enums/match-sort.enum.js'
import type { IPaginationParams } from './pagination-params.interface.js'

/** Filtres de `GET /editions/{id}/matchs`, déjà validés. `status` est exprimé en statuts publics. */
export interface IMatchListQuery {
  pagination: IPaginationParams
  roundKind?: ROUND_KIND
  poolRank?: number
  statuses?: MATCH_STATUS[]
  sort?: MATCH_SORT
}

/** Empreinte du contenu public d'une édition, base de l'ETag d'une édition en cours. */
export interface IEditionContentStamp {
  status: string
  lastMatchValidatedAt: string | null
  publicMatchCount: number
  lastDrawValidatedAt: string | null
  participationCount: number
}

export interface IEditionMatchCounts {
  total: number
  scored: number
  unknown: number
}
