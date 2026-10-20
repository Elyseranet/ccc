import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'

export const INTERNAL_ERROR_MESSAGE = 'Internal server error'
export const SERVICE_UNAVAILABLE_MESSAGE = 'Service unavailable'

export const API_ERROR_MESSAGE = {
  BAD_REQUEST: 'Bad request',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  COMPETITOR_NOT_FOUND: 'Competitor not found',
  ROUTE_NOT_FOUND: 'Route not found',
  EDITION_NOT_FOUND: 'Edition not found',
  CONFLICT: 'Conflict',
  GONE: 'Resource is no longer available',
  UNPROCESSABLE: 'Unprocessable entity',
  PAYLOAD_TOO_LARGE: 'Request body too large',
  RATE_LIMITED: 'Too many requests',
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_CURRENT_PASSWORD: 'Current password is incorrect',
  FORBIDDEN_ORIGIN: 'Cross-origin request refused',
  UNKNOWN: 'Error'
} as const

export const DEFAULT_CODE_BY_STATUS: Record<number, API_ERROR_CODE> = {
  400: API_ERROR_CODE.BAD_REQUEST,
  401: API_ERROR_CODE.UNAUTHORIZED,
  403: API_ERROR_CODE.FORBIDDEN,
  404: API_ERROR_CODE.NOT_FOUND,
  409: API_ERROR_CODE.CONFLICT,
  410: API_ERROR_CODE.GONE,
  413: API_ERROR_CODE.PAYLOAD_TOO_LARGE,
  422: API_ERROR_CODE.UNPROCESSABLE,
  429: API_ERROR_CODE.RATE_LIMITED,
  503: API_ERROR_CODE.SERVICE_UNAVAILABLE
}

export const DEFAULT_MESSAGE_BY_STATUS: Record<number, string> = {
  400: API_ERROR_MESSAGE.BAD_REQUEST,
  401: API_ERROR_MESSAGE.UNAUTHORIZED,
  403: API_ERROR_MESSAGE.FORBIDDEN,
  404: API_ERROR_MESSAGE.NOT_FOUND,
  409: API_ERROR_MESSAGE.CONFLICT,
  410: API_ERROR_MESSAGE.GONE,
  413: API_ERROR_MESSAGE.PAYLOAD_TOO_LARGE,
  422: API_ERROR_MESSAGE.UNPROCESSABLE,
  429: API_ERROR_MESSAGE.RATE_LIMITED
}
