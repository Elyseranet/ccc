import type { TIEBREAK_FORMAT } from '../enums/domain.enum.js'
import type { EDITION_STATUS } from '../enums/edition.enum.js'
import type { QUALIFICATION_ROUTE, TIEBREAK_SCOPE } from '../enums/qualification.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { IAdminMatch } from './admin-match.interface.js'
import type { ICompetitorPublic } from './competitor.interface.js'
import type { IPool } from './pool.interface.js'

/**
 * Configuration de la qualification (RG18) : « les `topPerPool` premiers de chaque poule + les `bestNextCount` meilleurs
 * (n+1)èmes ». `withPlayoff` : un tour de barrages précède les huitièmes (RG14, A9). Enregistrée à l'arrêt de la liste.
 */
export interface IQualificationParameters {
  topPerPool: number
  bestNextCount: number
  withPlayoff: boolean
}

/** Égalité non tranchée, à départager par un match TIEBREAK (A10, A11, R-1, R-2, R-6, R-7). */
export interface ITiebreakGroup {
  scope: TIEBREAK_SCOPE
  /** Poule de l'égalité pour `POOL` ; null pour `BOUNDARY`. */
  poolId: string | null
  /** Rang (1-based) de la première place disputée. */
  startRank: number
  /** `ONE_VS_ONE` : 2 joueurs, cible 5. `MULTI_SIDES` : 3 joueurs ou plus en un seul match, premier à 3. */
  format: TIEBREAK_FORMAT
  /** Places à pourvoir parmi ces joueurs (frontière entre poules) ; 0 pour une égalité de poule. */
  slots: number
  participationIds: string[]
  competitors: ICompetitorPublic[]
}

/**
 * État de la qualification d'une édition (`GET /admin/editions/{id}/qualification`), sans rien écrire. Calculé sur les
 * seuls matchs VALIDATED (E-f). `parameters` : la configuration enregistrée, sinon celle de la requête (`?topPerPool=&bestNextCount=`).
 */
export interface IQualificationStatus {
  /** true une fois la liste arrêtée (`edition.status` au moins QUALIFIED). */
  arrested: boolean
  parameters: IQualificationParameters | null
  pools: IPool[]
  /** Matchs de poule (REGULAR ou TIEBREAK) ni VALIDATED ni RESULT_UNKNOWN : ils bloquent l'arrêt de la liste. */
  pendingMatchCount: number
  /** Égalités à départager ; vide quand plus aucune ne bloque. */
  ties: ITiebreakGroup[]
  /** Départages déjà créés (purpose TIEBREAK), pour les saisir et les valider. */
  tiebreakMatches: IAdminMatch[]
  /** Qualifiés calculés avec `parameters` ; null sans configuration ; vide tant qu'une égalité bloque. */
  qualified: IQualifiedParticipant[] | null
}

export interface IQualifiedParticipant {
  participationId: string
  competitor: ICompetitorPublic
  poolId: string
  /** Place dans la poule. */
  poolRank: number
  route: QUALIFICATION_ROUTE
}

/** Réponse de `POST /editions/{id}/qualification` : la liste arrêtée. */
export interface IQualificationResult {
  parameters: IQualificationParameters
  editionStatus: EDITION_STATUS
  qualified: IQualifiedParticipant[]
  eliminatedCount: number
  /** true pour un rejeu à l'identique : aucun effet (idempotence). */
  replayed: boolean
}

/** Corps de `POST /editions/{id}/departages` : exactement l'un des groupes de `IQualificationStatus.ties`. */
export interface ICreateTiebreakRequest {
  participationIds: string[]
}

/**
 * Corps de `POST /editions/{id}/tirages/tour`. `roundKind` est déduit de la taille du vivier quand il est omis
 * (2 FINAL, 4 SEMI, 8 QUARTER, 16 ROUND_OF_16), ou PLAYOFF tant qu'aucun tour de phase finale n'est tiré et que la
 * qualification a `withPlayoff`. S'il est fourni, il doit être celui-là.
 */
export interface ICreateRoundDrawRequest {
  roundKind?: ROUND_KIND
}

/** Une place d'une affiche tirée physiquement (A1) : l'affiche `pairingIndex` (1..k), le côté 1 ou 2. */
export interface IRoundDrawAssignmentInput {
  participationId: string
  pairingIndex: number
  sidePosition: 1 | 2
  /** Ordre global du tirage, 1..N. */
  drawnOrder: number
}

/** Corps de `PUT /tirages/{id}/affectations` pour un tirage de TOUR (le tirage de poules garde `IUpdateDrawAssignmentsRequest`). */
export interface IUpdateRoundDrawRequest {
  assignments: IRoundDrawAssignmentInput[]
}
