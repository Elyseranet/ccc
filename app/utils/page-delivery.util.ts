import { API_SOURCES } from '~/consts/api-sources.const'
import { PAGE_DELIVERY } from '~/consts/page-delivery.const'
import { API_ENDPOINT } from '~/enums/api-endpoint.enum'
import { API_SOURCE } from '~/enums/api-source.enum'
import type { INavigationGroup, INavigationItem } from '~/interfaces/navigation.interface'
import type { IPageDelivery, IPageFixtureUsage } from '~/interfaces/page-delivery.interface'
import { isFixtureSelectionAllowed } from '~/utils/fixture.util'

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
  allowUndelivered: boolean = isFixtureSelectionAllowed(),
  table: Record<string, IPageDelivery> = PAGE_DELIVERY
): boolean => allowUndelivered || isPageDelivered(path, table)

/** Couples page livrée / endpoint encore en fixture : doit être vide pour une release. */
export const findDeliveredFixtureUsages = (
  table: Record<string, IPageDelivery> = PAGE_DELIVERY,
  sources: Record<API_ENDPOINT, API_SOURCE> = API_SOURCES
): IPageFixtureUsage[] =>
  Object.entries(table)
    .filter(([, page]) => page.delivered)
    .flatMap(([page, { endpoints }]) => endpoints
      .filter(endpoint => sources[endpoint] === API_SOURCE.FIXTURE)
      .map(endpoint => ({ page, endpoint })))

/** Routes des fichiers de `app/pages` absentes de la table. */
export const findUndeclaredPages = (routes: string[], table: Record<string, IPageDelivery> = PAGE_DELIVERY): string[] =>
  routes.filter(route => !(normalizeRoutePath(route) in table))

/** Entrées de la table qui ne correspondent à aucune page. */
export const findStalePages = (routes: string[], table: Record<string, IPageDelivery> = PAGE_DELIVERY): string[] => {
  const known = new Set(routes.map(normalizeRoutePath))
  return Object.keys(table).filter(route => !known.has(route))
}

/** Endpoints qu'aucune page ne déclare. */
export const findOrphanEndpoints = (table: Record<string, IPageDelivery> = PAGE_DELIVERY): API_ENDPOINT[] => {
  const used = new Set(Object.values(table).flatMap(page => page.endpoints))
  return Object.values(API_ENDPOINT).filter(endpoint => !used.has(endpoint))
}

export const filterDeliveredItems = (
  items: INavigationItem[],
  allowUndelivered: boolean = isFixtureSelectionAllowed(),
  table: Record<string, IPageDelivery> = PAGE_DELIVERY
): INavigationItem[] => items.filter(item => isPageAccessible(item.to, allowUndelivered, table))

/** Retire aussi les groupes devenus vides. */
export const filterDeliveredGroups = (
  groups: INavigationGroup[],
  allowUndelivered: boolean = isFixtureSelectionAllowed(),
  table: Record<string, IPageDelivery> = PAGE_DELIVERY
): INavigationGroup[] => groups
  .map(group => ({ ...group, items: filterDeliveredItems(group.items, allowUndelivered, table) }))
  .filter(group => group.items.length > 0)
