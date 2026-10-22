import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { ApiRequestError, parseRetryAfter, toApiRequestError } from '../../../src/utils/api-request-error.util'

const NOW = Date.parse('2026-10-21T12:00:00Z')

const rateLimited = (retryAfter: string | null) => ({
  statusCode: 429,
  data: { code: API_ERROR_CODE.RATE_LIMITED, message: 'Too many requests' },
  response: { headers: new Headers(retryAfter === null ? {} : { 'Retry-After': retryAfter }) }
})

describe('parseRetryAfter (RFC 9110)', () => {
  it('lit un nombre entier de secondes', () => {
    expect(parseRetryAfter('120', NOW)).toBe(120)
    expect(parseRetryAfter(' 0 ', NOW)).toBe(0)
  })

  it('convertit une date HTTP en secondes à partir de maintenant', () => {
    expect(parseRetryAfter('Wed, 21 Oct 2026 12:02:00 GMT', NOW)).toBe(120)
    expect(parseRetryAfter('Wed, 21 Oct 2026 12:00:00 GMT', NOW + 400)).toBe(0)
  })

  it('arrondit à la seconde supérieure et ne descend jamais sous zéro pour une date passée', () => {
    expect(parseRetryAfter('Wed, 21 Oct 2026 12:00:01 GMT', NOW - 400)).toBe(2)
    expect(parseRetryAfter('Wed, 21 Oct 2026 11:00:00 GMT', NOW)).toBe(0)
  })

  it('renvoie null pour une valeur absente ou invalide', () => {
    for (const value of [null, undefined, '', '   ', '-5', '1.5', 'abc', '12abc', 'Wed, 99 Oct 2026 12:00:00 GMT', '2026-10-21T12:00:00Z']) {
      expect(parseRetryAfter(value, NOW), String(value)).toBeNull()
    }
  })
})

describe('toApiRequestError et Retry-After', () => {
  it('porte la forme « secondes » d’un 429', () => {
    const error = toApiRequestError(rateLimited('30'))
    expect(error.error.statusCode).toBe(429)
    expect(error.retryAfterSeconds).toBe(30)
    expect(error.isOffline).toBe(false)
  })

  it('porte la forme « date HTTP » d’un 429 (non négative)', () => {
    const date = new Date(Date.now() + 90_000).toUTCString()
    const seconds = toApiRequestError(rateLimited(date)).retryAfterSeconds
    expect(seconds).not.toBeNull()
    expect(seconds!).toBeGreaterThan(80)
    expect(seconds!).toBeLessThanOrEqual(90)
  })

  it('lit Retry-After quel que soit le statut, par exemple un 503 SERVICE_BUSY', () => {
    const busy = { statusCode: 503, data: { code: API_ERROR_CODE.SERVICE_UNAVAILABLE, message: 'Busy' }, response: { headers: new Headers({ 'Retry-After': '7' }) } }
    expect(toApiRequestError(busy).retryAfterSeconds).toBe(7)
  })

  it('donne null sans en-tête, avec une valeur invalide, ou sans réponse', () => {
    expect(toApiRequestError(rateLimited(null)).retryAfterSeconds).toBeNull()
    expect(toApiRequestError(rateLimited('bientôt')).retryAfterSeconds).toBeNull()
    expect(toApiRequestError(new Error('réseau coupé')).retryAfterSeconds).toBeNull()
  })

  it('conserve l’erreur déjà typée telle quelle', () => {
    const typed = new ApiRequestError({ statusCode: 429, code: API_ERROR_CODE.RATE_LIMITED, message: 'x' }, false, 5)
    expect(toApiRequestError(typed)).toBe(typed)
    expect(typed.retryAfterSeconds).toBe(5)
  })
})

describe('ApiRequestError et createError de Nuxt (F-04)', () => {
  it('expose statusCode et data : le statut d’une erreur de useAsyncData survit à la sérialisation du payload', () => {
    const error = new ApiRequestError({ statusCode: 404, code: API_ERROR_CODE.NOT_FOUND, message: 'Competitor not found' })
    expect(error.statusCode).toBe(404)
    expect(error.data).toEqual(error.error)
    const wrapped = createError(error)
    expect(wrapped.statusCode).toBe(404)
    const serialized = JSON.parse(JSON.stringify({ statusCode: wrapped.statusCode, message: wrapped.message, data: wrapped.data }))
    expect(toApiRequestError(serialized).error).toMatchObject({ statusCode: 404, code: API_ERROR_CODE.NOT_FOUND })
  })
})
