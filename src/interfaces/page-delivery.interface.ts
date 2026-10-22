import type { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import type { LAYOUT } from '../enums/layout.enum.js'

export interface IPageDelivery {
  /** `true` quand la page est livrée en production ; sinon elle répond 404 et disparaît de la navigation. */
  delivered: boolean
  /** Layout de la page : ses endpoints (`LAYOUT_ENDPOINTS`) s'ajoutent à ceux de la page. */
  layout: LAYOUT
  /** Endpoints propres à la page, composables et services compris (hors layout). */
  endpoints: API_ENDPOINT[]
}

export interface IPageFixtureUsage {
  page: string
  endpoint: API_ENDPOINT
}
