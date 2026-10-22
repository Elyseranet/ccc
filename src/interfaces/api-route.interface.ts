import type { API_ENDPOINT } from '../enums/api-endpoint.enum.js'

export interface IApiRoute {
  /** Fichier de la route Nitro, relatif à `src/server/api/v1` (ex. `editions/[id]/matchs.get.ts`). */
  file: string
  /** Ticket back qui livre la route tant qu'elle n'existe pas encore (ARCH-11). Absent quand la route existe. */
  pendingTicket?: string
}

/** Page livrée qui consomme un endpoint dont la route n'existe pas encore : bloque une release (OPS-3). */
export interface IPagePendingUsage {
  page: string
  endpoint: API_ENDPOINT
  ticket: string
}
