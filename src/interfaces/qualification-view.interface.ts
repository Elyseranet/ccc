import type { TIEBREAK_FORMAT } from '../enums/domain.enum.js'
import type { POOL_DRAW_STEP_STATE } from '../enums/pool-draw.enum.js'
import type { PHASE_STEP, QUALIFICATION_BLOCKER, QUALIFICATION_FAILURE, QUALIFICATION_PARAMETER_ERROR, QUALIFICATION_RANK_STATUS, QUALIFICATION_ROUTE, QUALIFICATION_STEP, TIEBREAK_SCOPE } from '../enums/qualification.enum.js'
import type { TEditionPerson } from '../types/edition-person.type.js'
import type { IQualificationParameters, IQualificationStatus } from './qualification.interface.js'

/** Les champs de la configuration, tels que saisis (texte) : le contrôle les lit, il ne les corrige pas en silence. */
export interface IQualificationInputs {
  topPerPool: string
  bestNextCount: string
  withPlayoff: boolean
}

/** Verdict du contrôle des champs : la configuration lue (`null` tant qu'un champ est en erreur) et l'erreur de chaque champ. */
export interface IQualificationInputCheck {
  parameters: IQualificationParameters | null
  topPerPoolError: QUALIFICATION_PARAMETER_ERROR | null
  bestNextCountError: QUALIFICATION_PARAMETER_ERROR | null
}

/** Bornes liées à l'édition : plus grande poule (n au plus) et nombre de poules (m au plus). */
export interface IQualificationBounds {
  largestPool: number
  poolCount: number
}

export interface IQualificationStepView {
  step: QUALIFICATION_STEP
  state: POOL_DRAW_STEP_STATE
}

/** « Poules à jour » : matchs de poule validés sur le total, et ce qui reste. */
export interface IQualificationPrerequisites {
  validated: number
  total: number
  pending: number
  /** 0 à 100, pour la barre de progression. */
  percent: number
}

export interface IQualificationRankRow {
  key: string
  rank: number
  competitor: TEditionPerson
  wins: number
  difference: string
  status: QUALIFICATION_RANK_STATUS
}

export interface IQualificationRankTable {
  key: string
  poolRank: number
  rows: IQualificationRankRow[]
}

export interface IQualificationTieView {
  key: string
  scope: TIEBREAK_SCOPE
  /** Rang de la poule pour une égalité de poule, `null` pour une égalité entre poules. */
  poolRank: number | null
  startRank: number
  format: TIEBREAK_FORMAT
  slots: number
  members: TEditionPerson[]
  participationIds: string[]
  /** Un départage de ce groupe existe déjà et n'est pas joué : on le saisit dans « Poules et matchs ». */
  hasOpenTiebreak: boolean
  /** Le groupe est ce qui reste après un départage déjà joué (R-7) : le bouton dit « suivant ». */
  isFollowUp: boolean
  blocker: QUALIFICATION_BLOCKER | null
}

export interface IQualifiedRow {
  key: string
  poolRank: number
  rank: number
  competitor: TEditionPerson
  route: QUALIFICATION_ROUTE
  afterTiebreak: boolean
}

export interface IQualificationViewInput {
  status: IQualificationStatus
  check: IQualificationInputCheck
  closed: boolean
}

export interface IQualificationFailureView {
  failure: QUALIFICATION_FAILURE
}

export interface IQualificationPhaseStepsProps {
  current: PHASE_STEP
}

export interface IQualificationPrerequisitesProps {
  prerequisites: IQualificationPrerequisites
  /** L'édition est clôturée ou la liste arrêtée : plus rien à valider, le lien vers les matchs reste. */
  readonly: boolean
}

export interface IQualificationRankingProps {
  tables: IQualificationRankTable[]
}

export interface IQualificationTiesProps {
  ties: IQualificationTieView[]
  busyTie: string | null
  /** Aucune égalité et plus rien à valider : le message « Aucune égalité à départager ». */
  settled: boolean
  /** Matchs de poule à valider, pour la raison écrite sous un bouton inactif. */
  pendingCount: number
}

export interface IQualificationTiesEmits {
  (event: 'create', tie: IQualificationTieView): void
}

export interface IQualificationParametersProps {
  inputs: IQualificationInputs
  check: IQualificationInputCheck
  bounds: IQualificationBounds
  readonly: boolean
  /** Nombre de qualifiés annoncé (n × poules + m), `null` tant qu'un champ est invalide. */
  preview: number | null
}

export interface IQualificationParametersEmits {
  (event: 'update:topPerPool', value: string): void
  (event: 'update:bestNextCount', value: string): void
  (event: 'update:withPlayoff', value: boolean): void
}

export interface IQualificationFinalizeProps {
  rows: IQualifiedRow[]
  blocker: QUALIFICATION_BLOCKER | null
  pendingCount: number
  tieCount: number
  busy: boolean
  /** La liste est déjà arrêtée : l'aperçu reste, le bouton disparaît. */
  finalized: boolean
  qualifiedCount: number
}

export interface IQualificationFinalizeEmits {
  (event: 'finalize'): void
}
