import type { DRAW_KIND, DRAW_STATUS } from '../enums/draw.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { IAdminActor } from './admin-match.interface.js'
import type { ICompetitorPublic } from './competitor.interface.js'

export interface IDrawParameters {
  poolCount: number
  seedCount: number
}

/**
 * Affectation d'un tirage.
 * - `drawnOrder` : l'ordre GLOBAL du tirage (1..N), qui conserve « poule après poule » (RG11). Il n'existe pas de
 *   « place dans la poule » : elle n'a pas de sens sportif (round-robin), donc pas de champ `place`.
 * - `poolNumber` (tirage de poules) : la poule de destination, 1-based. Connue dès le brouillon, alors que `poolId`
 *   reste null tant que les poules ne sont pas créées. Null pour un tirage de tour.
 * - `pairingIndex` et `sidePosition` (tirage de tour uniquement) : numéro de l'affiche (1..k) et côté (1 ou 2).
 *   Null pour un tirage de poules.
 */
export interface IDrawAssignment {
  participationId: string
  competitorId: string
  displayName: string
  poolId: string | null
  poolNumber: number | null
  pairingIndex: number | null
  sidePosition: number | null
  drawnOrder: number
  assignedAt: string
}

export interface IDraw {
  id: string
  kind: DRAW_KIND
  roundKind: ROUND_KIND | null
  status: DRAW_STATUS
  parameters: IDrawParameters
  createdAt: string
  validatedAt: string | null
  assignments: IDrawAssignment[]
}

/** Tirage vu par l'administrateur : auteur de la création et de la validation (B-11). */
export interface IAdminDraw extends IDraw {
  createdBy: IAdminActor | null
  validatedBy: IAdminActor | null
}

/** `POST /editions/{id}/tirages/poules` : têtes de série choisies (RG9), `seeds` = participationIds. */
export interface ICreatePoolDrawRequest {
  poolCount: number
  seedCount: number
  seeds: string[]
}

export interface IDrawAssignmentInput {
  participationId: string
  /** Poule de destination, 1-based. */
  poolNumber: number
  /** Ordre global du tirage, 1..N. */
  drawnOrder: number
}

/** `PUT /tirages/{id}/affectations` (brouillon) : enregistre le tirage physique (A1). */
export interface IUpdateDrawAssignmentsRequest {
  assignments: IDrawAssignmentInput[]
}

export interface ISeedProposalEntry {
  participationId: string
  competitor: ICompetitorPublic
  rank: number
  /** Score ACP qui a servi au classement des têtes de série (RG9, A8). */
  acp: number
}

/** Proposition de têtes de série ; `unresolvedTies` : groupes à égalité parfaite, jamais tranchés (RG10). */
export interface ISeedProposal {
  seeds: ISeedProposalEntry[]
  unresolvedTies: string[][]
}

/** Compteurs cumulatifs : « finales jouées » inclut les titres, etc. (RG10, interprétation). */
export interface ISeedCandidate {
  playerId: string
  acp: number
  titles: number
  finals: number
  semis: number
  quarters: number
  roundsOf16: number
  playoffs: number
  participations: number
}

export interface ISeedRanking {
  ranked: ISeedCandidate[]
  /** Groupes de candidats à égalité parfaite sur tous les critères (RG10) : jamais tranchés. */
  unresolvedTies: string[][]
}
