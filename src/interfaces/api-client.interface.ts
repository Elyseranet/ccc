import type { IApiError } from './error.interface.js'
import type { MATCH_STATUS } from '../enums/match.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { USER_ROLE } from '../enums/user.enum.js'
import type { FIXTURE_VARIANT } from '../enums/fixture-variant.enum.js'

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

export interface IFetchErrorLike {
  statusCode?: number
  status?: number
  message?: string
  data?: Partial<IApiError>
  response?: { headers?: Pick<Headers, 'get'> }
}
