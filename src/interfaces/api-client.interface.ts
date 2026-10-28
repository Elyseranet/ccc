import type { IApiError } from './error.interface.js'
import type { SORT_ORDER } from '../enums/competitor-sort.enum.js'
import type { MATCH_STATUS } from '../enums/match.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { TApiFetcher } from '../types/api-fetcher.type.js'

export interface IApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, string | number | boolean | undefined>
  body?: Record<string, unknown> | FormData
}

export interface IBaseServiceOptions {
  baseUrl?: string
  timeout?: number
  fetcher?: TApiFetcher
}

export interface ICompetitorsQuery {
  q?: string
  edition?: string
  page?: number
  pageSize?: number
  sort?: string
  order?: SORT_ORDER
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

export interface IAsyncDataErrorData extends Partial<IApiError> {
  isOffline?: boolean
  retryAfterSeconds?: number | null
}
