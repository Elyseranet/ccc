import { createError } from 'h3'
import type { H3Error } from 'h3'
import { API_ERROR_CODE } from '../../../shared/enums/api-error-code.enum'
import { DEFAULT_CODE_BY_STATUS, INTERNAL_ERROR_MESSAGE, SERVICE_UNAVAILABLE_MESSAGE } from '../../consts/api-error.const'
import type { TApiErrorDetails } from '../../types/api-error-details.type'
import type { IApiError } from '../../../shared/interfaces/api/error.interface'



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

export const badRequest = (message = 'Bad request', details?: TApiErrorDetails): H3Error =>
  buildError(400, API_ERROR_CODE.BAD_REQUEST, message, details)

export const validationFailed = (details: TApiErrorDetails, message = 'Validation failed'): H3Error =>
  buildError(400, API_ERROR_CODE.VALIDATION_FAILED, message, details)

export const unauthorized = (message = 'Authentication required'): H3Error =>
  buildError(401, API_ERROR_CODE.UNAUTHORIZED, message)

export const forbidden = (message = 'Forbidden'): H3Error =>
  buildError(403, API_ERROR_CODE.FORBIDDEN, message)

export const notFound = (message = 'Resource not found'): H3Error =>
  buildError(404, API_ERROR_CODE.NOT_FOUND, message)

export const conflict = (message = 'Conflict', details?: TApiErrorDetails): H3Error =>
  buildError(409, API_ERROR_CODE.CONFLICT, message, details)

export const gone = (message = 'Resource is no longer available'): H3Error =>
  buildError(410, API_ERROR_CODE.GONE, message)

export const unprocessable = (message = 'Unprocessable entity', details?: TApiErrorDetails): H3Error =>
  buildError(422, API_ERROR_CODE.UNPROCESSABLE, message, details)

export const tooManyRequests = (message = 'Too many requests'): H3Error =>
  buildError(429, API_ERROR_CODE.RATE_LIMITED, message)

/** 5xx : le message est générique, le détail (cause) ne part que dans les logs. */
export const internalError = (): H3Error =>
  buildError(500, API_ERROR_CODE.INTERNAL_ERROR, INTERNAL_ERROR_MESSAGE)

export const serviceUnavailable = (): H3Error =>
  buildError(503, API_ERROR_CODE.SERVICE_UNAVAILABLE, SERVICE_UNAVAILABLE_MESSAGE)

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
    return { statusCode, code: API_ERROR_CODE.SERVICE_UNAVAILABLE, message: SERVICE_UNAVAILABLE_MESSAGE }
  }

  const data = (candidate?.data ?? {}) as { code?: API_ERROR_CODE, details?: IApiError['details'] }
  const code = data.code ?? DEFAULT_CODE_BY_STATUS[statusCode] ?? API_ERROR_CODE.BAD_REQUEST
  const apiError: IApiError = { statusCode, code, message: candidate?.message ?? 'Error' }
  if (data.details !== undefined) {
    apiError.details = data.details
  }
  return apiError
}
