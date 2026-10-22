import { API_ROUTES } from '../consts/api-routes.const.js'
import { LAYOUT_ENDPOINTS } from '../consts/layout-endpoints.const.js'
import { PAGE_DELIVERY } from '../consts/page-delivery.const.js'
import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import type { INavigationGroup, INavigationItem } from '../interfaces/navigation.interface.js'
import type { IApiRoute, IPagePendingUsage } from '../interfaces/api-route.interface.js'
import type { IPageDelivery } from '../interfaces/page-delivery.interface.js'

/** Dev et test : toutes les pages sont visibles, livrées ou non. Production : seules les pages livrées. */
export const isUndeliveredPageAllowed = (): boolean =>
  import.meta.dev || import.meta.test

/** `/editions/:id()` (vue-router) et `/editions/:id` (table) désignent la même route. */
export const normalizeRoutePath = (path: string): string => {
  const cleaned = (path.replace(/\(\)/g, '').split(/[?#]/)[0] ?? '').replace(/\/+$/, '')
  return cleaned || '/'
}

export const isPageDelivered = (path: string, table: Record<string, IPageDelivery> = PAGE_DELIVERY): boolean =>
  table[normalizeRoutePath(path)]?.delivered === true

/** Dev et test : tout est visible. Production : seules les pages livrées. */
export const isPageAccessible = (
  path: string,
  allowUndelivered: boolean = isUndeliveredPageAllowed(),
  table: Record<string, IPageDelivery> = PAGE_DELIVERY
): boolean => allowUndelivered || isPageDelivered(path, table)

/** Endpoints d'une page : les siens, plus ceux de son layout. */
export const getPageEndpoints = (page: IPageDelivery): API_ENDPOINT[] =>
  [...new Set([...LAYOUT_ENDPOINTS[page.layout], ...page.endpoints])]

/** Endpoints dont la route Nitro n'existe pas encore, avec le ticket back qui la livre (ARCH-11). */
export const findPendingEndpoints = (routes: Record<API_ENDPOINT, IApiRoute> = API_ROUTES): Array<{ endpoint: API_ENDPOINT, ticket: string }> =>
  (Object.entries(routes) as Array<[API_ENDPOINT, IApiRoute]>)
    .flatMap(([endpoint, route]) => route.pendingTicket ? [{ endpoint, ticket: route.pendingTicket }] : [])

/** Tickets back qu'attend une page (endpoints de la page et de son layout) : vide quand toutes ses routes existent. */
export const findPagePendingTickets = (
  path: string,
  table: Record<string, IPageDelivery> = PAGE_DELIVERY,
  routes: Record<API_ENDPOINT, IApiRoute> = API_ROUTES
): string[] => {
  const page = table[normalizeRoutePath(path)]
  return page ? [...new Set(getPageEndpoints(page).flatMap((endpoint) => routes[endpoint].pendingTicket ?? []))].sort() : []
}

/** Couples page livrée / endpoint sans route : doit être vide pour une release (OPS-3). */
export const findDeliveredPendingUsages = (
  table: Record<string, IPageDelivery> = PAGE_DELIVERY,
  routes: Record<API_ENDPOINT, IApiRoute> = API_ROUTES
): IPagePendingUsage[] =>
  Object.entries(table)
    .filter(([, page]) => page.delivered)
    .flatMap(([page, entry]) => getPageEndpoints(entry)
      .flatMap(endpoint => routes[endpoint].pendingTicket ? [{ page, endpoint, ticket: routes[endpoint].pendingTicket! }] : []))

/** Routes des fichiers de `src/pages` absentes de la table. */
export const findUndeclaredPages = (routes: string[], table: Record<string, IPageDelivery> = PAGE_DELIVERY): string[] =>
  routes.filter(route => !(normalizeRoutePath(route) in table))

/** Entrées de la table qui ne correspondent à aucune page. */
export const findStalePages = (routes: string[], table: Record<string, IPageDelivery> = PAGE_DELIVERY): string[] => {
  const known = new Set(routes.map(normalizeRoutePath))
  return Object.keys(table).filter(route => !known.has(route))
}

/** Endpoints qu'aucune page ne déclare. */
export const findOrphanEndpoints = (table: Record<string, IPageDelivery> = PAGE_DELIVERY): API_ENDPOINT[] => {
  const used = new Set(Object.values(table).flatMap(getPageEndpoints))
  return Object.values(API_ENDPOINT).filter(endpoint => !used.has(endpoint))
}

export const filterDeliveredItems = (
  items: INavigationItem[],
  allowUndelivered: boolean = isUndeliveredPageAllowed(),
  table: Record<string, IPageDelivery> = PAGE_DELIVERY
): INavigationItem[] => items.filter(item => isPageAccessible(item.to, allowUndelivered, table))

/** Retire aussi les groupes devenus vides. */
export const filterDeliveredGroups = (
  groups: INavigationGroup[],
  allowUndelivered: boolean = isUndeliveredPageAllowed(),
  table: Record<string, IPageDelivery> = PAGE_DELIVERY
): INavigationGroup[] => groups
  .map(group => ({ ...group, items: filterDeliveredItems(group.items, allowUndelivered, table) }))
  .filter(group => group.items.length > 0)
