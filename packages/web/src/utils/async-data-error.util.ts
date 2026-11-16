import type { NuxtError } from '#app'
import { DEFAULT_REQUEST_ERROR_MESSAGE, HTTP_STATUS_INTERNAL_SERVER_ERROR, NETWORK_ERROR_STATUS } from '../consts/http-status.const.js'
import type { IAsyncDataErrorData } from '../interfaces/api-client.interface.js'
import { ApiRequestError, toApiRequestError } from './api-request-error.util.js'

/*********************************************************
 * Erreurs de `useAsyncData`
 *
 * @description
 * `useAsyncData` range toute erreur dans une `NuxtError` dont le statut vaut 500 et dont la cause n'est pas rejouée
 * à l'hydratation : le statut réel (400, 404, 429), `Retry-After` et la distinction « hors ligne » seraient perdus.
 * `toAsyncDataError` les place dans `statusCode` et `data` (sérialisables dans le payload). `details` n'est jamais
 * recopié : il partirait dans le HTML hydraté et n'est affiché nulle part.
 * `fromAsyncDataError` reconstruit l'`ApiRequestError` attendu par `AsyncState`.
 ********************************************************/
export const toAsyncDataError = (cause: unknown): NuxtError => {
  const failure = toApiRequestError(cause)
  const data: IAsyncDataErrorData = {
    statusCode: failure.error.statusCode,
    code: failure.error.code,
    message: failure.error.message,
    isOffline: failure.isOffline,
    retryAfterSeconds: failure.retryAfterSeconds
  }
  return createError({ statusCode: failure.error.statusCode || HTTP_STATUS_INTERNAL_SERVER_ERROR, message: failure.error.message, data })
}

export const fromAsyncDataError = (error: unknown): ApiRequestError => {
  if (error instanceof ApiRequestError) {
    return error
  }
  const source = (error ?? {}) as { statusCode?: number, message?: string, data?: IAsyncDataErrorData }
  const data = source.data ?? {}
  const isOffline = data.isOffline === true
  return new ApiRequestError({
    statusCode: isOffline ? NETWORK_ERROR_STATUS : data.statusCode ?? source.statusCode ?? HTTP_STATUS_INTERNAL_SERVER_ERROR,
    code: data.code ?? toApiRequestError(error).error.code,
    message: data.message ?? source.message ?? DEFAULT_REQUEST_ERROR_MESSAGE
  }, isOffline, data.retryAfterSeconds ?? null)
}
