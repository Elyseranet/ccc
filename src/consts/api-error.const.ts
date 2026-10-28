import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'

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
  EMAIL_ALREADY_USED: 'Email already used',
  EDITION_CLOSED: 'The edition is closed',
  EDITION_CODE_EXHAUSTED: 'No edition code left for this year',
  EDITION_CONFLICT: 'The edition could not be created, please retry',
  PARTICIPANT_ALREADY_REGISTERED: 'The competitor is already registered in this edition',
  REGISTRATION_CLOSED: 'Registrations are closed: the pools draw is validated',
  PARTICIPATION_NOT_FOUND: 'Participation not found',
  GONE: 'Resource is no longer available',
  UNPROCESSABLE: 'Unprocessable entity',
  PAYLOAD_TOO_LARGE: 'Request body too large',
  RATE_LIMITED: 'Too many requests',
  REQUEST_TIMEOUT: 'Request body not received in time',
  AVATAR_TOO_LARGE: 'Avatar exceeds 2 MiB',
  AVATAR_UNSUPPORTED_TYPE: 'Avatar must be a JPEG, PNG or WebP image',
  AVATAR_UNREADABLE: 'Avatar image cannot be decoded',
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_CURRENT_PASSWORD: 'Current password is incorrect',
  FORBIDDEN_ORIGIN: 'Cross-origin request refused',
  MATCH_ALREADY_VALIDATED: 'Match already validated with different scores',
  MATCH_VERSION_CONFLICT: 'Match was modified by another session',
  NEXT_ROUND_ENGAGED: 'The next round is engaged: the score can no longer be corrected',
  SCORE_INCONSISTENT: 'Scores are inconsistent with the match format',
  MATCH_NOT_FOUND: 'Match not found',
  UNKNOWN: 'Error'
} as const

export const DEFAULT_CODE_BY_STATUS: Record<number, API_ERROR_CODE> = {
  400: API_ERROR_CODE.BAD_REQUEST,
  401: API_ERROR_CODE.UNAUTHORIZED,
  403: API_ERROR_CODE.FORBIDDEN,
  404: API_ERROR_CODE.NOT_FOUND,
  409: API_ERROR_CODE.CONFLICT,
  408: API_ERROR_CODE.REQUEST_TIMEOUT,
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
  408: API_ERROR_MESSAGE.REQUEST_TIMEOUT,
  410: API_ERROR_MESSAGE.GONE,
  413: API_ERROR_MESSAGE.PAYLOAD_TOO_LARGE,
  422: API_ERROR_MESSAGE.UNPROCESSABLE,
  429: API_ERROR_MESSAGE.RATE_LIMITED
}
