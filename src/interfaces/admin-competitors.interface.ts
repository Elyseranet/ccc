import type { ALIGN } from 'origam/enums'
import type { ACCOUNT_ERROR } from '../enums/account.enum.js'
import type { IAdminFailure } from './admin-failure.interface.js'
import type { ITranslatableText } from './common-components.interface.js'
import type { ICompetitorDetail, ICompetitorListItem } from './competitor.interface.js'

/** Valeurs saisies de la correction d'identité ; un champ vide (hors nom affiché) efface la valeur. */
export interface ICompetitorFormValues {
  displayName: string
  firstName: string
  lastName: string
  nickname: string
}

export interface IAdminCompetitorColumn {
  /** Propriété affichée (clé de colonne d'origam-data-table). */
  field: string
  title: ITranslatableText
  align?: ALIGN.START | ALIGN.END
  /** Largeur et largeur minimale : celles de la maquette (la table défile dans son conteneur). */
  width: string
  minWidth: string
}

export interface ICompetitorsToolbarProps {
  query: string
  total: number
}

export interface ICompetitorsToolbarEmits {
  (event: 'update:query', value: string): void
}

export interface ICompetitorsTableProps {
  competitors: ICompetitorListItem[]
  /** Compétiteur dont l'identité est en cours de correction : sa ligne est marquée. */
  selectedId: string | null
  page: number
  pageSize: number
  total: number
}

export interface ICompetitorsTableEmits {
  (event: 'update:page', value: number): void
}

export interface ICompetitorIdentityFormProps {
  competitor: ICompetitorDetail
  values: ICompetitorFormValues
  pending?: boolean
  failure?: IAdminFailure | null
  saved?: boolean
}

export interface ICompetitorIdentityFormEmits {
  (event: 'submit', values: ICompetitorFormValues): void
}

export interface ICompetitorPhotoProps {
  displayName: string
  /** Photo courante (`avatarUrl` de l'API), ou `null` : les initiales s'affichent alors. */
  avatarUrl?: string | null
  /** Cause d'échec à afficher (refus local ou erreur 413, 415, 422 du serveur). */
  error?: ACCOUNT_ERROR | null
  /** Un envoi ou un retrait est en cours. */
  pending?: boolean
}

export interface ICompetitorPhotoEmits {
  (event: 'select', file: File): void
  (event: 'invalid', reason: ACCOUNT_ERROR): void
  (event: 'remove'): void
}

export interface IReferenceHeadProps {
  title: string
}

export interface ICompetitorsScreenProps {
  /** Compétiteur dont l'identité se corrige (identifiant de l'URL), ou `null` sur l'annuaire seul. */
  competitorId?: string | null
}
