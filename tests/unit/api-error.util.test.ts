import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'
import { API_ERROR_MESSAGE, INTERNAL_ERROR_MESSAGE } from '../../server/consts/api-error.const'
import {
  badRequest,
  conflict,
  forbidden,
  gone,
  internalError,
  notFound,
  serviceUnavailable,
  toApiError,
  payloadTooLarge,
  tooManyRequests,
  unauthorized,
  unprocessable,
  validationFailed
} from '../../server/utils/http/api-error.util'

describe('api-error factories', () => {
  it.each([
    ['badRequest', badRequest(), 400, API_ERROR_CODE.BAD_REQUEST],
    ['validationFailed', validationFailed([{ path: 'a', message: 'bad' }]), 400, API_ERROR_CODE.VALIDATION_FAILED],
    ['unauthorized', unauthorized(), 401, API_ERROR_CODE.UNAUTHORIZED],
    ['forbidden', forbidden(), 403, API_ERROR_CODE.FORBIDDEN],
    ['notFound', notFound(), 404, API_ERROR_CODE.NOT_FOUND],
    ['conflict', conflict(), 409, API_ERROR_CODE.CONFLICT],
    ['gone', gone(), 410, API_ERROR_CODE.GONE],
    ['unprocessable', unprocessable(), 422, API_ERROR_CODE.UNPROCESSABLE],
    ['payloadTooLarge', payloadTooLarge(), 413, API_ERROR_CODE.PAYLOAD_TOO_LARGE],
    ['tooManyRequests', tooManyRequests(), 429, API_ERROR_CODE.RATE_LIMITED],
    ['internalError', internalError(), 500, API_ERROR_CODE.INTERNAL_ERROR],
    ['serviceUnavailable', serviceUnavailable(), 503, API_ERROR_CODE.SERVICE_UNAVAILABLE]
  ])('%s produces status %i and code %s', (_name, error, statusCode, code) => {
    expect(toApiError(error)).toMatchObject({ statusCode, code })
  })

  it('keeps the caller message and details on 4xx errors', () => {
    const apiError = toApiError(conflict('Draw already validated', { drawId: 12 }))
    expect(apiError).toEqual({
      statusCode: 409,
      code: API_ERROR_CODE.CONFLICT,
      message: 'Draw already validated',
      details: { drawId: 12 }
    })
  })

  it('omits details when none were given', () => {
    expect(toApiError(notFound())).not.toHaveProperty('details')
  })
})

describe('default messages', () => {
  it.each([
    ['badRequest', badRequest(), API_ERROR_MESSAGE.BAD_REQUEST],
    ['unauthorized', unauthorized(), API_ERROR_MESSAGE.UNAUTHORIZED],
    ['forbidden', forbidden(), API_ERROR_MESSAGE.FORBIDDEN],
    ['notFound', notFound(), API_ERROR_MESSAGE.NOT_FOUND],
    ['conflict', conflict(), API_ERROR_MESSAGE.CONFLICT],
    ['gone', gone(), API_ERROR_MESSAGE.GONE],
    ['unprocessable', unprocessable(), API_ERROR_MESSAGE.UNPROCESSABLE],
    ['payloadTooLarge', payloadTooLarge(), API_ERROR_MESSAGE.PAYLOAD_TOO_LARGE],
    ['tooManyRequests', tooManyRequests(), API_ERROR_MESSAGE.RATE_LIMITED],
    ['validationFailed', validationFailed([]), API_ERROR_MESSAGE.VALIDATION_FAILED]
  ])('%s uses its default message constant', (_name, error, message) => {
    expect(toApiError(error).message).toBe(message)
  })
})

describe('toApiError', () => {
  it('replaces the message of an unexpected error with a generic one', () => {
    const apiError = toApiError(new Error('connect ECONNREFUSED postgres://user:secret@db:5432/ccc'))
    expect(apiError).toEqual({
      statusCode: 500,
      code: API_ERROR_CODE.INTERNAL_ERROR,
      message: INTERNAL_ERROR_MESSAGE
    })
  })

  it('hides the message of a 5xx h3 error built with a sensitive message', () => {
    const error = Object.assign(new Error('relation "users" does not exist'), { statusCode: 500 })
    expect(toApiError(error).message).toBe(INTERNAL_ERROR_MESSAGE)
  })

  it('maps a plain h3 4xx without code to the default code of its status', () => {
    const error = Object.assign(new Error('Not here'), { statusCode: 404 })
    expect(toApiError(error)).toEqual({ statusCode: 404, code: API_ERROR_CODE.NOT_FOUND, message: API_ERROR_MESSAGE.NOT_FOUND })
  })

  it('handles non-error values', () => {
    expect(toApiError(undefined).statusCode).toBe(500)
    expect(toApiError('boom').statusCode).toBe(500)
  })
})

describe('toApiError third-party 4xx (T-SEC-03)', () => {
  it('ignores the message of an error without data.code', () => {
    const thirdParty = { statusCode: 400, message: 'secret internal parser detail' }
    expect(toApiError(thirdParty)).toEqual({
      statusCode: 400,
      code: API_ERROR_CODE.BAD_REQUEST,
      message: API_ERROR_MESSAGE.BAD_REQUEST
    })
  })

  it('falls back to a generic message for an unmapped 4xx status', () => {
    expect(toApiError({ statusCode: 418, message: 'teapot detail' }).message).toBe(API_ERROR_MESSAGE.UNKNOWN)
  })
})
