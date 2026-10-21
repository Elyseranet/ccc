import { API_ERROR_CODE } from '#shared/enums/api-error-code.enum'
import type { IApiError } from '#shared/interfaces/api/error.interface'

/*********************************************************
 * Erreur d'appel d'API
 *
 * @description
 * Rejet typé d'un statut non-2xx : porte le corps `IApiError` du serveur.
 * `isOffline` distingue une absence de réponse (réseau coupé, timeout) d'une réponse en erreur.
 ********************************************************/
export class ApiRequestError extends Error {
  readonly error: IApiError

  readonly isOffline: boolean

  constructor (error: IApiError, isOffline = false) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.error = error
    this.isOffline = isOffline
  }
}

interface IFetchErrorLike {
  statusCode?: number
  status?: number
  message?: string
  data?: Partial<IApiError>
  response?: unknown
}

export const toApiRequestError = (cause: unknown): ApiRequestError => {
  if (cause instanceof ApiRequestError) {
    return cause
  }
  const source = (cause ?? {}) as IFetchErrorLike
  const statusCode = source.statusCode ?? source.status ?? 0
  const isOffline = statusCode === 0 && !source.response
  return new ApiRequestError({
    statusCode,
    code: source.data?.code ?? API_ERROR_CODE.INTERNAL_ERROR,
    message: source.data?.message ?? source.message ?? 'Request failed',
    details: source.data?.details
  }, isOffline)
}
