import type { CAP_TONE } from '../enums/cap-tone.enum.js'
import type { CONFIRM_DIALOG_APPEARANCE } from '../enums/confirm-dialog.enum.js'
import type { GOLDEN_RULES_VARIANT } from '../enums/golden-rules-variant.enum.js'
import type { ICompetitorPublic } from './competitor.interface.js'
import type { TSize } from 'origam/types'
import type { ApiRequestError } from '../utils/api-request-error.util.js'

export interface ITranslatableText {
  key: string
  fallback: string
  params?: Record<string, string | number>
}

export interface IBreadcrumbEntry {
  text: ITranslatableText
  to?: string
}

export interface IPageHeroSlots {
  eyebrow?: () => unknown
  'after-lead'?: () => unknown
}

export interface IPageHeroProps {
  title: ITranslatableText
  subtitle?: ITranslatableText
  breadcrumb?: IBreadcrumbEntry[]
}

export interface ICapBadgeProps {
  /** Texte dans la capsule (le code d'une erreur, un nombre de titres) ; absent, la capsule est seule. */
  text?: string
  /** Position verticale du texte, en unités du viewBox. */
  textY?: number
  /** Taille du texte, en unités du viewBox. */
  textSize?: number
  /** Teinte de la coque ; l'ambre de la marque par défaut. */
  tone?: CAP_TONE
}

export interface IPlayerLinkProps {
  competitor: Pick<ICompetitorPublic, 'id' | 'displayName'>
  titles?: number
  size?: TSize
  inline?: boolean
  /** Le nom peut passer à la ligne (sinon il reste sur une ligne, comme un bouton). */
  wrap?: boolean
  /** Le lien coule comme du texte en ligne (nom et étoiles passent à la ligne comme dans une phrase). */
  flow?: boolean
}

export interface IAsyncStateProps {
  pending?: boolean
  error?: ApiRequestError | null
  empty?: boolean
  emptyTitle?: ITranslatableText
  emptyDescription?: ITranslatableText
}

export interface IAsyncStateEmits {
  (event: 'retry'): void
}

export interface IGoldenRule {
  number: number
  key: string
  label: string
  detail?: ITranslatableText
}

export interface IGoldenRulesProps {
  variant?: GOLDEN_RULES_VARIANT
}

export interface IBubblesOptions {
  canvas: HTMLCanvasElement
  colors: string[]
}

export interface IAppPaginationProps {
  page: number
  total: number
  pageSize: number
}

export interface IAppPaginationEmits {
  (event: 'update:page', value: number): void
}

export interface IConfirmDialogProps {
  open: boolean
  busy: boolean
  title: string
  /** Ce qui va se passer. */
  text: string
  /** Phrase d'avertissement en gras après le texte (« Cette action n'est pas annulable. »). */
  warning?: string
  cancelLabel: string
  confirmLabel: string
  /** Préfixe des `data-cy` : `{préfixe}-dialog`, `{préfixe}-cancel`, `{préfixe}-confirm`. */
  cyPrefix: string
  confirmColor?: string
  confirmSize?: string
  confirmElevation?: string
  /** Bouton de confirmation inactif tant que la saisie demandée (F-26 : le code de l'édition) n'est pas faite. */
  confirmDisabled?: boolean
  /** `false` : le focus initial est laissé au contenu du dialogue (le champ de saisie), au lieu du bouton « Annuler ». */
  focusCancel?: boolean
  /** `MOCKUP` : gabarit de la maquette d'F-24 ; `DEFAULT` : rendu historique du dialogue de validation du tirage (F-11), inchangé jusqu'à F-30. */
  appearance?: CONFIRM_DIALOG_APPEARANCE
}

export interface IConfirmDialogEmits {
  (event: 'cancel'): void
  (event: 'confirm'): void
}

