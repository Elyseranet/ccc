import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { API_ROUTES } from '../../../src/consts/api-routes.const'
import { API_ENDPOINT } from '../../../src/enums/api-endpoint.enum'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { EditionService } from '../../../src/services/edition.service'
import { ApiRequestError, toApiRequestError } from '../../../src/utils/api-request-error.util'
import { findPendingEndpoints } from '../../../src/utils/page-delivery.util'

const API_DIRECTORY = join(process.cwd(), 'src/server/api/v1')

describe('table endpoint -> route (ARCH-8, ARCH-11)', () => {
  it('nomme une route pour chaque endpoint', () => {
    expect(Object.keys(API_ROUTES).sort()).toEqual(Object.values(API_ENDPOINT).sort())
  })

  it('le fichier de route existe si et seulement si aucun ticket back n’est attendu', () => {
    const mismatches = Object.entries(API_ROUTES).filter(([, route]) =>
      existsSync(join(API_DIRECTORY, route.file)) === Boolean(route.pendingTicket))
    expect(mismatches).toEqual([])
  })

  it('liste les 13 endpoints encore attendus de la vague 3a, avec leur ticket back', () => {
    const byTicket = findPendingEndpoints().reduce<Record<string, number>>((count, { ticket }) => ({ ...count, [ticket]: (count[ticket] ?? 0) + 1 }), {})
    expect(byTicket).toEqual({ 'B-10': 2, 'B-11': 5, 'B-12': 3, 'B-16': 3 })
  })
})

describe('services : toujours l’API réelle', () => {
  it('EditionService.list appelle GET /api/v1/editions, sans aucune source de remplacement', async () => {
    const live = [{ id: 'live-edition' }]
    const handler = vi.fn(() => live)
    registerEndpoint('/api/v1/editions', defineEventHandler(handler))
    expect(await new EditionService().list()).toEqual(live)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('client HTTP', () => {
  it('rejette en ApiRequestError avec le corps IApiError du serveur sur un statut non-2xx', async () => {
    registerEndpoint('/api/v1/editions/introuvable', defineEventHandler((event) => {
      setResponseStatus(event, 404)
      return { statusCode: 404, code: API_ERROR_CODE.NOT_FOUND, message: 'Introuvable' }
    }))
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
