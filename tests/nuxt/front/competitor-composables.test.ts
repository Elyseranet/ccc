import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useCompetitor } from '../../../src/composables/useCompetitor'
import { useCompetitors } from '../../../src/composables/useCompetitors'
import { useHeadToHead } from '../../../src/composables/useHeadToHead'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'
import { fromAsyncDataError, toAsyncDataError } from '../../../src/utils/async-data-error.util'

const SAM = '00000000-0000-4000-0001-000000000009'
const MAYA = '00000000-0000-4000-0001-000000000005'
const UNKNOWN = '00000000-0000-4000-0001-999999999999'

const harness = async <T extends Record<string, unknown>>(setup: () => T): Promise<T> => {
  let result: T | undefined
  await mountSuspended(defineComponent({
    async setup () {
      result = setup()
      await Promise.all(Object.values(result).filter((value): value is Promise<unknown> => typeof (value as { then?: unknown })?.then === 'function'))
      return () => h('div')
    }
  }))
  return result as T
}

describe('erreurs de useAsyncData (statut conservé)', () => {
  it('un 404 garde son statut et son code après conversion aller-retour', () => {
    const original = new ApiRequestError({ statusCode: 404, code: API_ERROR_CODE.COMPETITOR_NOT_FOUND, message: 'Compétiteur inconnu' })
    const restored = fromAsyncDataError(toAsyncDataError(original))
    expect(restored.error.statusCode).toBe(404)
    expect(restored.error.code).toBe(API_ERROR_CODE.COMPETITOR_NOT_FOUND)
    expect(restored.isOffline).toBe(false)
  })

  it('un 400 et un 429 gardent leur statut, et le 429 garde Retry-After', () => {
    expect(fromAsyncDataError(toAsyncDataError(new ApiRequestError({ statusCode: 400, code: API_ERROR_CODE.BAD_REQUEST, message: 'x' }))).error.statusCode).toBe(400)
    const limited = fromAsyncDataError(toAsyncDataError(new ApiRequestError({ statusCode: 429, code: API_ERROR_CODE.RATE_LIMITED, message: 'x' }, false, 30)))
    expect(limited.error.statusCode).toBe(429)
    expect(limited.error.code).toBe(API_ERROR_CODE.RATE_LIMITED)
    expect(limited.retryAfterSeconds).toBe(30)
  })

  it('l’état hors ligne (aucune réponse) est conservé', () => {
    const offline = new ApiRequestError({ statusCode: 0, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'x' }, true)
    const restored = fromAsyncDataError(toAsyncDataError(offline))
    expect(restored.isOffline).toBe(true)
    expect(restored.error.statusCode).toBe(0)
  })

  it('les détails de l’erreur ne sont jamais copiés dans la NuxtError (payload SSR)', () => {
    const original = new ApiRequestError({ statusCode: 400, code: API_ERROR_CODE.VALIDATION_FAILED, message: 'x', details: [{ path: 'adversaire', message: 'secret interne' }] })
    expect(JSON.stringify(toAsyncDataError(original).data)).not.toContain('secret interne')
  })
})

describe('composables compétiteurs à identifiants nullables', () => {
  it('useCompetitor(null) ne requête rien et vaut null', async () => {
    const handler = vi.fn(() => ({}))
    registerEndpoint('/api/v1/competiteurs/null', defineEventHandler(handler))
    const { asyncData } = await harness(() => ({ asyncData: useCompetitor(null) }))
    expect(asyncData.data.value).toBeNull()
    expect(asyncData.error.value).toBeUndefined()
    expect(handler).not.toHaveBeenCalled()
  })

  it('useCompetitor d’un identifiant inconnu conserve le statut 404', async () => {
    registerEndpoint(`/api/v1/competiteurs/${UNKNOWN}`, defineEventHandler((event) => {
      setResponseStatus(event, 404)
      return { statusCode: 404, code: API_ERROR_CODE.COMPETITOR_NOT_FOUND, message: 'Compétiteur inconnu' }
    }))
    const { asyncData } = await harness(() => ({ asyncData: useCompetitor(UNKNOWN) }))
    expect(asyncData.data.value ?? null).toBeNull()
    expect(fromAsyncDataError(asyncData.error.value).error.statusCode).toBe(404)
  })

  it('useCompetitor d’un joueur connu renvoie sa fiche', async () => {
    registerEndpoint(`/api/v1/competiteurs/${SAM}`, defineEventHandler(() => ({ id: SAM, displayName: 'Sam Dupont' })))
    const { asyncData } = await harness(() => ({ asyncData: useCompetitor(SAM) }))
    expect(asyncData.data.value?.displayName).toBe('Sam Dupont')
  })

  it('useHeadToHead sans l’un des deux identifiants ne requête rien et vaut null', async () => {
    const handler = vi.fn(() => ({}))
    registerEndpoint(`/api/v1/competiteurs/${SAM}/face-a-face`, defineEventHandler(handler))
    const { asyncData } = await harness(() => ({ asyncData: useHeadToHead(SAM, null) }))
    expect(asyncData.data.value).toBeNull()
    expect(asyncData.error.value).toBeUndefined()
    expect(handler).not.toHaveBeenCalled()
  })

  it('useHeadToHead envoie l’adversaire en paramètre et conserve un 400', async () => {
    registerEndpoint(`/api/v1/competiteurs/${SAM}/face-a-face`, defineEventHandler((event) => {
      if (getQuery(event).adversaire === SAM) {
        setResponseStatus(event, 400)
        return { statusCode: 400, code: API_ERROR_CODE.BAD_REQUEST, message: 'même joueur' }
      }
      return { played: 0 }
    }))
    const same = await harness(() => ({ asyncData: useHeadToHead(SAM, SAM) }))
    expect(fromAsyncDataError(same.asyncData.error.value).error.statusCode).toBe(400)
    const other = await harness(() => ({ asyncData: useHeadToHead(SAM, MAYA) }))
    expect(other.asyncData.data.value).toEqual({ played: 0 })
  })

  it('useCompetitors : deux usages simultanés ont chacun leur clé de cache', async () => {
    registerEndpoint('/api/v1/competiteurs', defineEventHandler(() => ({ items: [], total: 0, page: 1, pageSize: 20 })))
    const result = await harness(() => ({
      first: useCompetitors({ pageSize: 20 }, 'a'),
      second: useCompetitors({ pageSize: 20 }, 'b'),
      nuxtApp: useNuxtApp()
    }))
    const stored = Object.keys(result.nuxtApp.payload.data).filter((key) => key.startsWith('competitors:'))
    expect(stored).toEqual(expect.arrayContaining(['competitors:a', 'competitors:b']))
  })
})
