import type { API_ENDPOINT } from '~/enums/api-endpoint.enum'

export interface IPageDelivery {
  /** `true` quand la page est livrée en production ; sinon elle répond 404 et disparaît de la navigation. */
  delivered: boolean
  /** Endpoints consommés par la page, y compris via les composables, les services et la session. */
  endpoints: API_ENDPOINT[]
}

export interface IPageFixtureUsage {
  page: string
  endpoint: API_ENDPOINT
}
