import type { ADMIN_MATCH_FILTER } from '../enums/admin-match-filter.enum.js'
import type { EDITION_CHIP_FAMILY } from '../enums/edition-tab.enum.js'
import type { MATCH_ACTION } from '../enums/match-action.enum.js'
import type { IAdminMatch } from './admin-match.interface.js'
import type { ITranslatableText } from './common-components.interface.js'

/** Une carte de la file : tout ce que la vue affiche, calculé hors du composant. */
export interface IMatchCard {
  id: string
  match: IAdminMatch
  /** N° du match `{édition}-{rang}` (RG24). */
  number: string
  poolRank: number | null
  round: ITranslatableText
  statusLabel: ITranslatableText
  family: EDITION_CHIP_FAMILY
  firstName: string
  secondName: string
  /** Score à afficher (saisi, ou validé), `null` tant qu'il n'y en a pas. */
  firstScore: number | null
  secondScore: number | null
  /** `null` : rien à faire (validé, résultat inconnu, édition archivée). */
  action: MATCH_ACTION | null
}

export interface IMatchFilterView {
  value: ADMIN_MATCH_FILTER
  label: string
  count: number
}

export interface IMatchQueueFiltersProps {
  filters: IMatchFilterView[]
  filter: ADMIN_MATCH_FILTER
  /** Rangs de poule présents dans l'édition. */
  pools: number[]
  /** `null` : toutes les poules. */
  pool: number | null
}

export interface IMatchQueueFiltersEmits {
  (event: 'update:filter', value: ADMIN_MATCH_FILTER): void
  (event: 'update:pool', value: number | null): void
}

export interface IMatchQueueProps {
  cards: IMatchCard[]
}

export interface IMatchQueueEmits {
  (event: 'enter', id: string): void
  (event: 'validate', id: string): void
}
