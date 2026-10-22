import type { EDITION_STATUS } from '../enums/edition.enum.js'
import type { FINAL_STAGE } from '../enums/participation.enum.js'
import type { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import type { IMatchRecord } from './stats.interface.js'
import type { COMPETITOR_SORT, SORT_ORDER } from '../enums/competitor-sort.enum.js'

/**
 * Identité publique d'un compétiteur. Ne contient jamais d'email ni de téléphone (invariant 8).
 */
export interface ICompetitorPublic {
  id: string
  displayName: string
  firstName: string | null
  lastName: string | null
  nickname: string | null
  avatarUrl: string | null
}

/** Identité publique et titres (A8 : éditions CLOSED, comptés par `countTitles`). */
export interface ICompetitorWithTitles extends ICompetitorPublic {
  titles: number
}

export interface ICompetitorListItem extends ICompetitorWithTitles {
  editionsPlayed: number
  /** R-5 : matchs avec score uniquement (victoires + défaites). */
  matchesPlayed: number
  wins: number
  losses: number
  /** R-5 : matchs REGULAR au résultat inconnu, ni victoire ni défaite. */
  unknownResults: number
  firstEditionCode: string | null
}

export interface ICompetitorParticipation {
  editionId: string
  editionCode: string
  year: number
  editionName: string | null
  editionStatus: EDITION_STATUS
  finalStage: FINAL_STAGE | null
  points: number | null
  /** Numéro de la poule de l'édition (1-based) ; null si l'édition n'a pas de poule pour ce joueur. */
  poolNumber: number | null
  /** Place dans la poule (inchangé : ce n'est PAS le numéro de la poule). */
  poolRank: number | null
  /** Victoires de l'édition, matchs REGULAR avec score (R-5). */
  wins: number
  /** Défaites de l'édition, matchs REGULAR avec score (R-5). */
  losses: number
  /** R-5 : matchs REGULAR au résultat inconnu dans l'édition, ni victoire ni défaite. */
  unknownResults: number
}

export interface ICompetitorStats {
  /** Matchs avec score uniquement (R-5). */
  played: number
  wins: number
  losses: number
  unknownResults: number
  pointsFor: number
  pointsAgainst: number
  titles: number
}

export interface ICompetitorDetail extends ICompetitorPublic {
  participations: ICompetitorParticipation[]
  stats: ICompetitorStats
}

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

/**
 * `PATCH /competiteurs/{id}` (administrateur) : corriger une identité. L'avatar passe par
 * `PUT /competiteurs/{id}/avatar` (B-16), pas par cette route.
 */
export interface IUpdateCompetitorRequest {
  displayName?: string
  firstName?: string | null
  lastName?: string | null
  nickname?: string | null
}
