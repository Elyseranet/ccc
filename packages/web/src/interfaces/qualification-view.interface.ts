import type { TIEBREAK_FORMAT } from '../enums/domain.enum.js'
import type { POOL_DRAW_STEP_STATE } from '../enums/pool-draw.enum.js'
import type { QUALIFICATION_BLOCKER, QUALIFICATION_FAILURE, QUALIFICATION_PARAMETER_ERROR, QUALIFICATION_RANK_STATUS, QUALIFICATION_REOPEN_BLOCKER, QUALIFICATION_ROUTE, QUALIFICATION_STEP, TIEBREAK_SCOPE } from '../enums/qualification.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
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

/** Le départage ouvert d'un groupe : de quoi le supprimer (identifiant du match, numéro affiché) et dire s'il est déjà joué. */
export interface IOpenTiebreakView {
  matchId: string
  /** `{code de l'édition}-{séquence}`, comme dans « Poules et matchs ». */
  number: string
  /** Un score est saisi : le départage n'est plus supprimable (409 `TIEBREAK_PLAYED`). */
  played: boolean
}

export interface IQualificationTieView {
  key: string
  scope: TIEBREAK_SCOPE
  /** Rang de la poule pour une égalité de poule, `null` pour une égalité entre poules. */
  poolRank: number | null
  /** Place disputée : le rang dans la poule (égalité de poule) ou le rang que les joueurs ont dans leur poule (« meilleur 3e » entre poules). */
  placeRank: number
  format: TIEBREAK_FORMAT
  slots: number
  members: TEditionPerson[]
  participationIds: string[]
  /** Un départage de ce groupe existe déjà et n'est pas joué : on le saisit dans « Poules et matchs ». */
  hasOpenTiebreak: boolean
  /** Le départage ouvert de ce groupe (programmé ou saisi, pas encore validé), `null` s'il n'y en a pas. */
  openTiebreak: IOpenTiebreakView | null
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
  /** Groupe dont le départage est en cours de suppression (la suppression est un envoi : un seul à la fois). */
  deletingTie: string | null
  /** Aucune égalité et plus rien à valider : le message « Aucune égalité à départager ». */
  settled: boolean
  /** Matchs de poule à valider, pour la raison écrite sous un bouton inactif. */
  pendingCount: number
}

export interface IQualificationTiesEmits {
  (event: 'create', tie: IQualificationTieView): void
  (event: 'delete', tie: IQualificationTieView): void
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
  /** La liste est déjà arrêtée : l'aperçu reste, le bouton disparaît (le slot `finalized-action` porte « Rouvrir »). */
  finalized: boolean
  qualifiedCount: number
  /** Configuration enregistrée, pour la phrase « n premiers par poule… » de la liste arrêtée. */
  parameters: IQualificationParameters | null
}

export interface IQualificationFinalizeEmits {
  (event: 'finalize'): void
}

/** Le brouillon du tirage du premier tour que « Rouvrir les qualifications » efface (B-25) : son tour et le nombre d'affiches déjà saisies. */
export interface IQualificationReopenDraft {
  roundKind: ROUND_KIND | null
  pairingCount: number
}

export interface IQualificationReopenProps {
  /** `null` : le bouton est actif ; sinon inactif, la raison est écrite dessous. */
  blocker: QUALIFICATION_REOPEN_BLOCKER | null
  /** Premier tour de phase finale déduit de la liste arrêtée, `null` quand il se choisit au tirage. */
  roundKind: ROUND_KIND | null
  /** Brouillon du tirage du premier tour, `null` quand il n'y en a pas. */
  draft: IQualificationReopenDraft | null
  open: boolean
  /** Lecture du brouillon en cours (avant l'ouverture de la boîte). */
  preparing: boolean
  /** Écriture en cours (la boîte reste ouverte, bouton en chargement). */
  busy: boolean
  qualifiedCount: number
}

export interface IQualificationReopenEmits {
  (event: 'open'): void
  (event: 'cancel'): void
  (event: 'confirm'): void
}
