import type { MATCH_STATUS } from '../../shared/enums/match.enum'
import type { ROUND_KIND } from '../../shared/enums/round.enum'
import type { MATCH_SORT } from '../enums/match-sort.enum'
import type { IPaginationParams } from './pagination-params.interface'

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

/** Ligne brute de l'empreinte de contenu (colonnes SQL en snake_case, comptes en texte). */
export interface IEditionContentStampRow {
  last_match_validated_at: Date | null
  public_match_count: string
  last_draw_validated_at: Date | null
  participation_count: string
}

export interface IEditionMatchCounts {
  total: number
  scored: number
  unknown: number
}
