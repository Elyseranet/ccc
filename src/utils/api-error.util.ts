import { createError } from 'h3'
import type { H3Error } from 'h3'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { API_ERROR_MESSAGE, DEFAULT_CODE_BY_STATUS, DEFAULT_MESSAGE_BY_STATUS, INTERNAL_ERROR_MESSAGE, SERVICE_UNAVAILABLE_MESSAGE } from '../consts/api-error.const.js'
import type { TApiErrorDetails } from '../types/api-error-details.type.js'
import type { IApiError } from '../interfaces/error.interface.js'

const buildError = (
  statusCode: number,
  code: API_ERROR_CODE,
  message: string,
  details?: TApiErrorDetails
): H3Error => createError({
  statusCode,
  message,
  data: { code, ...(details === undefined ? {} : { details }) }
})

export const badRequest = (message: string = API_ERROR_MESSAGE.BAD_REQUEST, details?: TApiErrorDetails): H3Error =>
  buildError(400, API_ERROR_CODE.BAD_REQUEST, message, details)

export const validationFailed = (details: TApiErrorDetails, message: string = API_ERROR_MESSAGE.VALIDATION_FAILED): H3Error =>
  buildError(400, API_ERROR_CODE.VALIDATION_FAILED, message, details)

export const unauthorized = (message: string = API_ERROR_MESSAGE.UNAUTHORIZED): H3Error =>
  buildError(401, API_ERROR_CODE.UNAUTHORIZED, message)

export const forbidden = (message: string = API_ERROR_MESSAGE.FORBIDDEN): H3Error =>
  buildError(403, API_ERROR_CODE.FORBIDDEN, message)

export const notFound = (message: string = API_ERROR_MESSAGE.NOT_FOUND): H3Error =>
  buildError(404, API_ERROR_CODE.NOT_FOUND, message)

export const competitorNotFound = (): H3Error =>
  buildError(404, API_ERROR_CODE.COMPETITOR_NOT_FOUND, API_ERROR_MESSAGE.COMPETITOR_NOT_FOUND)

export const conflict = (message: string = API_ERROR_MESSAGE.CONFLICT, details?: TApiErrorDetails): H3Error =>
  buildError(409, API_ERROR_CODE.CONFLICT, message, details)

export const gone = (message: string = API_ERROR_MESSAGE.GONE): H3Error =>
  buildError(410, API_ERROR_CODE.GONE, message)

export const payloadTooLarge = (): H3Error =>
  buildError(413, API_ERROR_CODE.PAYLOAD_TOO_LARGE, API_ERROR_MESSAGE.PAYLOAD_TOO_LARGE)

export const unprocessable = (message: string = API_ERROR_MESSAGE.UNPROCESSABLE, details?: TApiErrorDetails): H3Error =>
  buildError(422, API_ERROR_CODE.UNPROCESSABLE, message, details)

export const tooManyRequests = (message: string = API_ERROR_MESSAGE.RATE_LIMITED): H3Error =>
  buildError(429, API_ERROR_CODE.RATE_LIMITED, message)

export const invalidCredentials = (): H3Error =>
  buildError(401, API_ERROR_CODE.INVALID_CREDENTIALS, API_ERROR_MESSAGE.INVALID_CREDENTIALS)

export const invalidCurrentPassword = (): H3Error =>
  buildError(401, API_ERROR_CODE.INVALID_CURRENT_PASSWORD, API_ERROR_MESSAGE.INVALID_CURRENT_PASSWORD)

export const forbiddenOrigin = (): H3Error =>
  buildError(403, API_ERROR_CODE.FORBIDDEN_ORIGIN, API_ERROR_MESSAGE.FORBIDDEN_ORIGIN)

/** 5xx : le message est générique, le détail (cause) ne part que dans les logs. */
export const internalError = (): H3Error =>
  buildError(500, API_ERROR_CODE.INTERNAL_ERROR, INTERNAL_ERROR_MESSAGE)

export const serviceUnavailable = (): H3Error =>
  buildError(503, API_ERROR_CODE.SERVICE_UNAVAILABLE, SERVICE_UNAVAILABLE_MESSAGE)

/** 503 transitoire : `retryAfterSeconds` est repris dans l'en-tête `Retry-After` par le plugin api-response. */
export const serviceBusy = (retryAfterSeconds: number): H3Error => createError({
  statusCode: 503,
  message: SERVICE_UNAVAILABLE_MESSAGE,
  data: { code: API_ERROR_CODE.SERVICE_BUSY, retryAfterSeconds }
})

export const requestTimeout = (): H3Error =>
  buildError(408, API_ERROR_CODE.REQUEST_TIMEOUT, API_ERROR_MESSAGE.REQUEST_TIMEOUT)

const defaultMessageForStatus = (statusCode: number): string =>
  DEFAULT_MESSAGE_BY_STATUS[statusCode] ?? API_ERROR_MESSAGE.UNKNOWN

/**
 * Normalise n'importe quelle erreur vers le contrat IApiError.
 * Toute erreur 5xx ou non-h3 devient un message générique.
 */
export const toApiError = (error: unknown): IApiError => {
  const candidate = error as Partial<H3Error> | null | undefined
  const statusCode = typeof candidate?.statusCode === 'number' ? candidate.statusCode : 500

  if (statusCode >= 500 && statusCode !== 503) {
    return { statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: INTERNAL_ERROR_MESSAGE }
  }
  if (statusCode === 503) {
    const busy = (candidate?.data as { code?: API_ERROR_CODE } | undefined)?.code === API_ERROR_CODE.SERVICE_BUSY
    return { statusCode, code: busy ? API_ERROR_CODE.SERVICE_BUSY : API_ERROR_CODE.SERVICE_UNAVAILABLE, message: SERVICE_UNAVAILABLE_MESSAGE }
  }

  const data = (candidate?.data ?? {}) as { code?: API_ERROR_CODE, details?: IApiError['details'] }
  const code = data.code ?? DEFAULT_CODE_BY_STATUS[statusCode] ?? API_ERROR_CODE.BAD_REQUEST
  // Seule une erreur construite par nos fabriques (data.code présent) maîtrise son message ;
  // le message d'une erreur h3 ou tierce n'est jamais repris.
  const message = data.code !== undefined && candidate?.message ? candidate.message : defaultMessageForStatus(statusCode)
  const apiError: IApiError = { statusCode, code, message }
  if (data.details !== undefined) {
    apiError.details = data.details
  }
  return apiError
}
