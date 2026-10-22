import type { EDITION_ORIGIN, EDITION_STATUS } from '../enums/edition.enum.js'
import type { ACCOUNT_STATE, USER_STATUS } from '../enums/user.enum.js'
import type { FINAL_STAGE, PARTICIPATION_STATUS } from '../enums/participation.enum.js'
import type { INewCompetitor } from './competitor-creation.interface.js'
import type { ICompetitorPublic } from './competitor.interface.js'
import type { IDraw } from './draw.interface.js'
import type { IMatch } from './match.interface.js'
import type { IPool } from './pool.interface.js'
import type { IBracketRound, IRound } from './round.interface.js'

export interface IEditionChampion {
  competitor: ICompetitorPublic
  titlesToDate: number
}

export interface IEditionSummary {
  id: string
  code: string
  year: number
  name: string | null
  heldOn: string | null
  location: string | null
  status: EDITION_STATUS
  origin: EDITION_ORIGIN
  /** N figé à la clôture (RG2, A6) ; null tant que l'édition n'est pas close. */
  participantCount: number | null
  /** A6 : participantCount moins les participants listés (2012a, 2012b : 5) ; null si N est inconnu. */
  unidentifiedParticipantCount: number | null
  /** Matchs programmés de l'édition, tous statuts confondus (un score saisi non validé compte comme « à jouer »). */
  matchCount: number
  /** Matchs VALIDATED : les seuls dont le score est public. */
  scoredMatchCount: number
  /** R-5 : matchs RESULT_UNKNOWN, ni victoire ni défaite dans les bilans. */
  unknownResultMatchCount: number
  champion: IEditionChampion | null
}

export interface IEditionParticipant {
  participationId: string
  competitor: ICompetitorPublic
  poolId: string | null
  isSeed: boolean
  seedRank: number | null
  status: PARTICIPATION_STATUS
  finalStage: FINAL_STAGE | null
  points: number | null
  poolRank: number | null
}

/**
 * `editions.comment` n'est volontairement pas exposé : sa visibilité n'est pas tranchée.
 */
export interface IEditionDetail extends IEditionSummary {
  description: string | null
  participants: IEditionParticipant[]
  pools: IPool[]
  rounds: IRound[]
  matches: IMatch[]
  draws: IDraw[]
  bracket: IBracketRound[]
}

/** `POST /editions` (administrateur). `code` et `chronologicalRank` sont calculés par le serveur. */
export interface ICreateEditionRequest {
  year: number
  name: string
  /** Date au format `YYYY-MM-DD`. */
  heldOn?: string | null
  description?: string | null
  location?: string | null
}

/**
 * `PATCH /editions/{id}` : informations générales uniquement. `code` (R-9), `year`,
 * `chronologicalRank` et `status` sont refusés en 400.
 */
export interface IUpdateEditionRequest {
  name?: string
  heldOn?: string | null
  description?: string | null
  location?: string | null
}

/** `POST /editions/{id}/participants` : `{ competitorId }` rattache un compétiteur existant. */
export interface IAddExistingParticipantRequest {
  competitorId: string
}

/** `POST /editions/{id}/participants` : `{ newCompetitor }` crée compétiteur, compte, invitation et participation (C8). */
export interface IAddNewParticipantRequest {
  newCompetitor: INewCompetitor
}

/** Réponse de `POST /editions/{id}/participants`. `invitationSent` est `null` quand aucune invitation n'est en jeu (compétiteur existant). */
export interface IAddParticipantResult extends IEditionParticipant {
  invitationSent: boolean | null
}

export interface IAdminParticipantAccount {
  state: ACCOUNT_STATE
  /** Expiration de l'invitation la plus récente ; `null` pour un compte actif. */
  invitationExpiresAt: string | null
}

/**
 * `GET /admin/editions/{id}/participants` : la liste des inscrits vue par l'administrateur.
 * Ne contient ni email ni téléphone.
 */
export interface IAdminParticipant extends IEditionParticipant {
  /** Éditions jouées, toutes éditions confondues (même calcul que `ICompetitorListItem.editionsPlayed`). */
  editionsPlayed: number
  /** `null` pour un compétiteur sans compte (archive). */
  account: IAdminParticipantAccount | null
}

/** Ce que la décision d'état d'un compte lit du compte et de son invitation la plus récente. */
export interface IAccountStateInput {
  status: USER_STATUS
  latestInvitation: { expiresAt: Date, consumedAt: Date | null } | null
}
