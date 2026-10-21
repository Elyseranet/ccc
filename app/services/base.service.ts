import { API_ERROR_CODE } from '#shared/enums/api-error-code.enum'
import { API_BASE_URL, API_TIMEOUT_MS } from '~/consts/api.const'
import { HTTP_STATUS_TOO_MANY_REQUESTS } from '~/consts/async-state.const'
import { API_SOURCES } from '~/consts/api-sources.const'
import type { API_ENDPOINT } from '~/enums/api-endpoint.enum'
import { API_SOURCE } from '~/enums/api-source.enum'
import { FIXTURE_VARIANT } from '~/enums/fixture-variant.enum'
import type { IApiRequestOptions, IBaseServiceOptions } from '~/interfaces/api-client.interface'
import type { IFixtureSet } from '~/interfaces/fixture.interface'
import { ApiRequestError, toApiRequestError } from '~/utils/api-request-error.util'

/*********************************************************
 * BaseService
 *
 * @description
 * Unique client HTTP de l'application : `$fetch` (pas d'axios). URL de base `/api/v1`,
 * `timeout` explicite, rejet typé `ApiRequestError` sur statut non-2xx, aucun retry
 * (la validation de score est idempotente côté serveur, pas côté client).
 * Aucun en-tête `Content-Type` n'est posé à la main : `$fetch` envoie `application/json` pour un objet, et le navigateur ajoute
 * lui-même le `boundary` d'un `FormData` (téléversement d'avatar, B-16).
 * `resolve` choisit la source (fixture ou API réelle) d'après `API_SOURCES`.
 ********************************************************/
export abstract class BaseService {
  protected readonly baseUrl: string

  protected readonly timeout: number

  protected readonly variant: FIXTURE_VARIANT

  protected constructor (options: IBaseServiceOptions = {}) {
    this.baseUrl = options.baseUrl ?? API_BASE_URL
    this.timeout = options.timeout ?? API_TIMEOUT_MS
    this.variant = options.variant ?? FIXTURE_VARIANT.DEFAULT
  }

  protected async request<T> (path: string, options: IApiRequestOptions = {}): Promise<T> {
    try {
      const response: unknown = await $fetch(path, {
        baseURL: this.baseUrl,
        timeout: this.timeout,
        retry: 0,
        method: options.method ?? 'GET',
        query: options.query,
        body: options.body
      })
      return response as T
    } catch (cause) {
      throw toApiRequestError(cause)
    }
  }

  protected async resolve<T> (endpoint: API_ENDPOINT, live: () => Promise<T>, fixture: () => Promise<IFixtureSet<T>>): Promise<T> {
    if (API_SOURCES[endpoint] === API_SOURCE.LIVE) {
      return live()
    }
    if (this.variant === FIXTURE_VARIANT.RATE_LIMITED) {
      throw new ApiRequestError({ statusCode: HTTP_STATUS_TOO_MANY_REQUESTS, code: API_ERROR_CODE.RATE_LIMITED, message: 'Fixture rate limited variant' })
    }
    if (this.variant === FIXTURE_VARIANT.ERROR) {
      throw new ApiRequestError({ statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'Fixture error variant' })
    }
    const set = await fixture()
    if (this.variant === FIXTURE_VARIANT.EMPTY) {
      return set.empty
    }
    return this.variant === FIXTURE_VARIANT.REGISTRATION ? (set.registration ?? set.default) : set.default
  }
}
