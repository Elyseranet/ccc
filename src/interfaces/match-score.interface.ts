import type { MATCH_STATUS } from '../enums/match.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { EditionEntity } from '../server/db/typeorm/entities/edition.entity.js'
import type { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import type { IScoreSideInput } from './score.interface.js'

/** Filtres de `GET /admin/editions/{id}/matchs`, déjà validés. Les statuts sont des statuts stockés. */
export interface IAdminMatchListQuery {
  roundKind?: ROUND_KIND
  poolRank?: number
  statuses?: MATCH_STATUS[]
}

/** Contexte d'une écriture de score : qui, quelle version est attendue, quelle requête. */
export interface IScoreCommand {
  matchId: string
  userId: string
  requestId?: string
  scores: IScoreSideInput[]
  /** Version attendue (`If-Match`) ; absente si l'en-tête n'est pas fourni. */
  expectedVersion?: number
}

export interface IScoreWriteOutcome {
  matchId: string
  editionId: string
  /** true si la commande était un rejeu sans effet. */
  replayed: boolean
}

/** Match verrouillé (FOR UPDATE) avec ses relations d'admin et son édition. */
export interface ILockedMatch {
  match: MatchEntity
  edition: EditionEntity
}
