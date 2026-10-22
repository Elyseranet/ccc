import { DEFAULT_REQUEST_ERROR_MESSAGE, NETWORK_ERROR_STATUS } from '../consts/http-status.const.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import type { IApiError } from '../interfaces/error.interface.js'
import { HTTP_DATE, MS_PER_SECOND, RETRY_AFTER_SECONDS } from '../consts/retry-after.const.js'
import type { IFetchErrorLike } from '../interfaces/api-client.interface.js'

/*********************************************************
 * Erreur d'appel d'API
 *
 * @description
 * Rejet typé d'un statut non-2xx : porte le corps `IApiError` du serveur.
 * `isOffline` distingue une absence de réponse (réseau coupé, timeout) d'une réponse en erreur.
 * `retryAfterSeconds` porte l'en-tête `Retry-After` d'une réponse en erreur, quel que soit le statut (429, 503 ; RFC 9110 : secondes ou date HTTP), null s'il est absent ou invalide.
 ********************************************************/
export class ApiRequestError extends Error {
  readonly error: IApiError

  readonly isOffline: boolean

  readonly retryAfterSeconds: number | null

  constructor (error: IApiError, isOffline = false, retryAfterSeconds: number | null = null) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.error = error
    this.isOffline = isOffline
    this.retryAfterSeconds = retryAfterSeconds
  }

  /** Lus par `createError` de Nuxt (`useAsyncData`) : le statut et le corps survivent à la sérialisation du payload (un 404 reste un 404). */
  get statusCode (): number {
    return this.error.statusCode
  }

  get data (): IApiError {
    return this.error
  }
}

/*********************************************************
 * Retry-After
 *
 * @description
 * RFC 9110 : un nombre entier de secondes, ou une date HTTP (IMF-fixdate) convertie en secondes à partir de `now`
 * (jamais négatif). Toute autre valeur donne null.
 ********************************************************/
export const parseRetryAfter = (value: string | null | undefined, now: number = Date.now()): number | null => {
  const text = value?.trim()
  if (!text) {
    return null
  }
  if (RETRY_AFTER_SECONDS.test(text)) {
    return Number(text)
  }
  if (!HTTP_DATE.test(text)) {
    return null
  }
  const at = Date.parse(text)
  return Number.isNaN(at) ? null : Math.max(0, Math.ceil((at - now) / MS_PER_SECOND))
}

export const toApiRequestError = (cause: unknown): ApiRequestError => {
  if (cause instanceof ApiRequestError) {
    return cause
  }
  const source = (cause ?? {}) as IFetchErrorLike
  const statusCode = source.statusCode ?? source.status ?? NETWORK_ERROR_STATUS
  const isOffline = statusCode === NETWORK_ERROR_STATUS && !source.response
  const retryAfterSeconds = parseRetryAfter(source.response?.headers?.get('retry-after'))
  return new ApiRequestError({
    statusCode,
    code: source.data?.code ?? API_ERROR_CODE.INTERNAL_ERROR,
    message: source.data?.message ?? source.message ?? DEFAULT_REQUEST_ERROR_MESSAGE,
    details: source.data?.details
  }, isOffline, retryAfterSeconds)
}
