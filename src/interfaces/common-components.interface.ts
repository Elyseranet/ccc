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

