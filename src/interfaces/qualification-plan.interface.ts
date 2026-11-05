import type { TIEBREAK_FORMAT } from '../enums/domain.enum.js'
import type { EDITION_STATUS } from '../enums/edition.enum.js'
import type { QUALIFICATION_ROUTE, TIEBREAK_SCOPE } from '../enums/qualification.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import type { ParticipationEntity } from '../server/db/typeorm/entities/participation.entity.js'
import type { PoolEntity } from '../server/db/typeorm/entities/pool.entity.js'
import type { IPoolStanding } from './pool.interface.js'
import type { IMatchRecord } from './stats.interface.js'
import type { IQualificationParameters, IRoundDrawAssignmentInput } from './qualification.interface.js'
import type { TRoundDrawBlock } from '../types/qualification.type.js'

/** Une poule pour le calcul de la qualification : ses membres (participationId). */
export interface IQualificationPoolInput {
  poolId: string
  memberIds: string[]
}

/** Égalité à départager, avec des identifiants de participation (le service y ajoute les identités). */
export interface IQualificationTie {
  scope: TIEBREAK_SCOPE
  poolId: string | null
  startRank: number
  format: TIEBREAK_FORMAT
  slots: number
  playerIds: string[]
}

export interface IQualifiedEntry {
  playerId: string
  poolId: string
  poolRank: number
  route: QUALIFICATION_ROUTE
}

export interface IQualificationComputation {
  /** Un classement par poule, dans l'ordre de `pools`. */
  standings: IPoolStanding[]
  /** Égalités qui bloquent l'arrêt de la liste avec `parameters` ; vide sans paramètres ou sans égalité. */
  blockingTies: IQualificationTie[]
  /** Toutes les égalités de poule encore ouvertes, quelle que soit la frontière (un départage peut les trancher). */
  poolTies: IQualificationTie[]
  /** Qualifiés ; null sans paramètres ; vide tant qu'une égalité bloque. */
  qualified: IQualifiedEntry[] | null
}

/** Entrée de la déduction du prochain tirage de tour (une seule fonction pour l'aperçu et la création). */
export interface IRoundDrawPlanInput {
  editionStatus: EDITION_STATUS
  qualification: IQualificationParameters | null
  /** Tours de phase finale déjà tirés (hors POOLS), avec leur achèvement (tous les matchs validés). */
  knockoutRounds: Array<{ kind: ROUND_KIND, completed: boolean }>
  candidateCount: number
}

export interface IRoundDrawPlan {
  roundKind: ROUND_KIND | null
  blockedBy: TRoundDrawBlock | null
}


/** Entrée de la vérification des affiches d'un tirage de tour. */
export interface IRoundDrawCheckInput {
  assignments: readonly IRoundDrawAssignmentInput[]
  candidateIds: readonly string[]
  roundKind: ROUND_KIND
  /** Premiers de poule (place 1) : ils ne jouent jamais les barrages (RG14). */
  poolWinnerIds: readonly string[]
  /** true à la validation : tout le vivier est tiré (hors barrages), chaque affiche a deux côtés. */
  complete: boolean
}

/** Poules, inscrits en poule et matchs du tour de poules d'une édition, avec les enregistrements pour le classement. */
export interface IPoolContext {
  pools: PoolEntity[]
  participations: ParticipationEntity[]
  /** Matchs du tour de poules, REGULAR et TIEBREAK, avec leurs côtés. */
  matches: MatchEntity[]
  poolInputs: IQualificationPoolInput[]
  /** Matchs VALIDATED ou RESULT_UNKNOWN uniquement (clé = participation). */
  records: IMatchRecord[]
}
