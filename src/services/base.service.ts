import { API_BASE_URL, API_TIMEOUT_MS } from '../consts/api.const.js'
import type { IApiRequestOptions, IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import type { TApiFetcher } from '../types/api-fetcher.type.js'
import { toApiRequestError } from '../utils/api-request-error.util.js'

/*********************************************************
 * BaseService
 *
 * @description
 * Unique client HTTP de l'application : `$fetch` (pas d'axios). URL de base `/api/v1`,
 * `timeout` explicite, rejet typé `ApiRequestError` sur statut non-2xx, aucun retry
 * (la validation de score est idempotente côté serveur, pas côté client).
 * Aucun en-tête `Content-Type` n'est posé à la main : `$fetch` envoie `application/json` pour un objet, et le navigateur ajoute
 * lui-même le `boundary` d'un `FormData` (téléversement d'avatar, B-16).
 * Toujours l'API réelle (ARCH-8) : aucune fixture. Les composables passent `useRequestFetch()` en `fetcher`, pour que le
 * rendu serveur transmette les cookies de la requête (session) à l'API.
 ********************************************************/
export abstract class BaseService {
  protected readonly baseUrl: string

  protected readonly timeout: number

  protected readonly fetcher: TApiFetcher

  protected constructor (options: IBaseServiceOptions = {}) {
    this.baseUrl = options.baseUrl ?? API_BASE_URL
    this.timeout = options.timeout ?? API_TIMEOUT_MS
    this.fetcher = options.fetcher ?? $fetch
  }

  protected async request<T> (path: string, options: IApiRequestOptions = {}): Promise<T> {
    try {
      const response: unknown = await this.fetcher(path, {
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
}
