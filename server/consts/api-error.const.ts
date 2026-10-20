import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'

export const INTERNAL_ERROR_MESSAGE = 'Internal server error'
export const SERVICE_UNAVAILABLE_MESSAGE = 'Service unavailable'

export const API_ERROR_MESSAGE = {
  BAD_REQUEST: 'Bad request',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  ROUTE_NOT_FOUND: 'Route not found',
  CONFLICT: 'Conflict',
  GONE: 'Resource is no longer available',
  UNPROCESSABLE: 'Unprocessable entity',
  RATE_LIMITED: 'Too many requests',
  UNKNOWN: 'Error'
} as const

export const DEFAULT_CODE_BY_STATUS: Record<number, API_ERROR_CODE> = {
  400: API_ERROR_CODE.BAD_REQUEST,
  401: API_ERROR_CODE.UNAUTHORIZED,
  403: API_ERROR_CODE.FORBIDDEN,
  404: API_ERROR_CODE.NOT_FOUND,
  409: API_ERROR_CODE.CONFLICT,
  410: API_ERROR_CODE.GONE,
  422: API_ERROR_CODE.UNPROCESSABLE,
  429: API_ERROR_CODE.RATE_LIMITED,
  503: API_ERROR_CODE.SERVICE_UNAVAILABLE
}
