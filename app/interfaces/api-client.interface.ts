import type { MATCH_STATUS } from '#shared/enums/match.enum'
import type { ROUND_KIND } from '#shared/enums/round.enum'
import type { USER_ROLE } from '#shared/enums/user.enum'
import type { FIXTURE_VARIANT } from '~/enums/fixture-variant.enum'

export interface IApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, string | number | boolean | undefined>
  body?: Record<string, unknown> | FormData
}

export interface IBaseServiceOptions {
  baseUrl?: string
  timeout?: number
  variant?: FIXTURE_VARIANT
}

export interface IMeServiceOptions extends IBaseServiceOptions {
  fixtureRole?: USER_ROLE | null
}

export interface ICompetitorsQuery {
  q?: string
  edition?: string
  page?: number
  pageSize?: number
  sort?: string
}

export interface IEditionMatchesQuery {
  page?: number
  pageSize?: number
  tour?: ROUND_KIND
  poule?: number
  statut?: MATCH_STATUS[]
  tri?: string
}

export interface IAdminMatchesQuery {
  statut?: MATCH_STATUS[]
  tour?: ROUND_KIND
  poule?: number
}
