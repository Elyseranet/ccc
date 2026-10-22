import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { API_SOURCES } from '../../../src/consts/api-sources.const'
import { API_ENDPOINT } from '../../../src/enums/api-endpoint.enum'
import { API_SOURCE } from '../../../src/enums/api-source.enum'
import { FIXTURE_VARIANT } from '../../../src/enums/fixture-variant.enum'
import { EditionService } from '../../../src/services/edition.service'
import { ApiRequestError, toApiRequestError } from '../../../src/utils/api-request-error.util'
import { findFixtureEndpoints } from '../../../src/utils/fixture.util'

const original = { ...API_SOURCES }

afterEach(() => {
  Object.assign(API_SOURCES, original)
  vi.unstubAllGlobals()
})

describe('table endpoint -> source', () => {
  it('définit une source pour chaque endpoint', () => {
    for (const endpoint of Object.values(API_ENDPOINT)) {
      expect(Object.values(API_SOURCE)).toContain(API_SOURCES[endpoint])
    }
  })

  it('bascule fixture -> live en changeant une seule ligne, sans toucher au service', async () => {
    const live = [{ id: 'live-edition' }]
    const handler = vi.fn(() => live)
    registerEndpoint('/api/v1/editions', defineEventHandler(handler))
    const service = new EditionService()

    const fromFixture = await service.list()
    expect(handler).not.toHaveBeenCalled()
    expect(fromFixture).toHaveLength(16)

    API_SOURCES[API_ENDPOINT.EDITIONS] = API_SOURCE.LIVE
    const fromLive = await service.list()
    expect(handler).toHaveBeenCalledTimes(1)
    expect(fromLive).toEqual(live)
  })

  it('une route basculée en live ne change pas la source des autres', async () => {
    registerEndpoint('/api/v1/stats', defineEventHandler(() => ({ editions: 1, competitors: 2, matches: 3, scoredMatches: 4 })))
    API_SOURCES[API_ENDPOINT.STATS] = API_SOURCE.LIVE
    const service = new EditionService()
    expect(await service.stats()).toEqual({ editions: 1, competitors: 2, matches: 3, scoredMatches: 4 })
    expect((await service.list()).length).toBe(16)
  })
})

describe('variantes de fixture', () => {
  it('empty renvoie une liste vide', async () => {
    const service = new EditionService({ variant: FIXTURE_VARIANT.EMPTY })
    expect(await service.list()).toEqual([])
  })

  it('error rejette avec une ApiRequestError typée', async () => {
    const service = new EditionService({ variant: FIXTURE_VARIANT.ERROR })
    const failure = await service.list().catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ApiRequestError)
    expect((failure as ApiRequestError).error.code).toBe(API_ERROR_CODE.INTERNAL_ERROR)
    expect((failure as ApiRequestError).error.statusCode).toBe(500)
  })
})

describe('client HTTP', () => {
  it('rejette en ApiRequestError avec le corps IApiError du serveur sur un statut non-2xx', async () => {
    registerEndpoint('/api/v1/editions/introuvable', defineEventHandler((event) => {
      setResponseStatus(event, 404)
      return { statusCode: 404, code: API_ERROR_CODE.NOT_FOUND, message: 'Introuvable' }
    }))
    API_SOURCES[API_ENDPOINT.EDITION] = API_SOURCE.LIVE
    const failure = await new EditionService().detail('introuvable').catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ApiRequestError)
    expect((failure as ApiRequestError).error).toMatchObject({ statusCode: 404, code: API_ERROR_CODE.NOT_FOUND })
    expect((failure as ApiRequestError).isOffline).toBe(false)
  })

  it('distingue l’absence de réponse (réseau coupé, timeout) d’une réponse en erreur', () => {
    expect(toApiRequestError(new TypeError('Failed to fetch')).isOffline).toBe(true)
    expect(toApiRequestError({ statusCode: 503, data: { code: API_ERROR_CODE.INTERNAL_ERROR, message: 'x' } }).isOffline).toBe(false)
  })

  it('utilise $fetch et jamais axios', async () => {
    const { readFileSync } = await import('node:fs')
    const source = readFileSync('src/services/base.service.ts', 'utf8')
    expect(source).not.toMatch(/from 'axios'|require\('axios'\)/)
    expect(source).toMatch(/\$fetch/)
  })
})

describe('garde de release', () => {
  it('findFixtureEndpoints liste les endpoints encore en fixture', () => {
    expect(findFixtureEndpoints({ A: API_SOURCE.FIXTURE, B: API_SOURCE.LIVE })).toEqual(['A'])
  })
})
