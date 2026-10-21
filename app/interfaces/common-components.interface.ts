import type { ICompetitorPublic } from '#shared/interfaces/api/competitor.interface'
import type { TSize } from 'origam/types'
import type { ApiRequestError } from '~/utils/api-request-error.util'

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
}

export interface IBubblesOptions {
  canvas: HTMLCanvasElement
  colors: string[]
}
