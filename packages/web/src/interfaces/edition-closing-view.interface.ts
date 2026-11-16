import type { CLOSING_FAILURE, CLOSING_NOTICE, CLOSING_STATE } from '../enums/edition-closing-view.enum.js'
import type { FINAL_STAGE } from '../enums/participation.enum.js'
import type { ITranslatableText } from './common-components.interface.js'

export interface IClosingPrerequisite {
  id: string
  label: ITranslatableText
  met: boolean
}

export interface IClosingPerson {
  id: string
  displayName: string
}

/** Une ligne du tableau d'aperçu (maquette `admin-cloture`) : base du barème (RG1), effectif N (RG2) et points figés pour ce résultat. */
export interface IClosingPreviewRow {
  stage: FINAL_STAGE
  base: number
  /** `null` : tour non disputé dans cette édition, affiché « / » (RG3). */
  points: number | null
}

export interface IEditionClosingView {
  state: CLOSING_STATE
  participantCount: number
  prerequisites: IClosingPrerequisite[]
  champion: IClosingPerson | null
  finalist: IClosingPerson | null
  rows: IClosingPreviewRow[]
}

export interface IClosingPrerequisitesProps {
  prerequisites: IClosingPrerequisite[]
  champion: IClosingPerson | null
  finalist: IClosingPerson | null
  participantCount: number
}

export interface IClosingEffectsProps {
  rows: IClosingPreviewRow[]
  participantCount: number
}

export interface IClosingConfirmProps {
  /** Code de l'édition à saisir pour confirmer (décision du 2026-11-05). */
  code: string
  year: number
  busy: boolean
  disabled: boolean
  /** Raison écrite sous le bouton quand il est inactif ; vide sinon. */
  reason: string
}

export interface IClosingStateProps {
  kind: CLOSING_NOTICE
  year: number
  /** Instant de clôture (ISO 8601) ; `null` pour les archives du dump, qui n'en ont pas (B-22). */
  closedAt: string | null
}

export interface IClosingConfirmEmits {
  (event: 'confirm'): void
}

export interface IClosingFailureView {
  failure: CLOSING_FAILURE
  title: string
  body: string
  verifiable: boolean
}
