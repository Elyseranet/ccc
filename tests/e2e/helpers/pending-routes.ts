import { test } from '@playwright/test'
import { findPagePendingTickets } from '../../../src/utils/page-delivery.util'

/** Type d'annotation Playwright des tests d'une page qui attend une route serveur (ARCH-11). */
export const AWAITING_ROUTE_ANNOTATION = 'awaiting-route'

/**
 * Marque le test courant quand sa page consomme un endpoint dont la route Nitro n'existe pas encore (`API_ROUTES`,
 * `pendingTicket`) : l'annotation nomme les tickets back attendus et apparaît dans le rapport. Tant que la page reste
 * un squelette qui n'appelle pas ces routes, le test tourne normalement. Quand l'écran les appelle, son ticket front
 * passe les cas qui en dépendent en `test.fixme` avec ces mêmes tickets, jusqu'au merge de la route.
 */
export const markAwaitingRoutes = (path: string): string[] => {
  const tickets = findPagePendingTickets(path)
  if (tickets.length > 0) {
    test.info().annotations.push({ type: AWAITING_ROUTE_ANNOTATION, description: tickets.join(', ') })
  }
  return tickets
}
