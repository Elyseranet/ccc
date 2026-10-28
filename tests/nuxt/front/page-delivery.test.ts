import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LAYOUT_ENDPOINTS } from '../../../src/consts/layout-endpoints.const'
import { PAGE_DELIVERY } from '../../../src/consts/page-delivery.const'
import { ROUTES } from '../../../src/consts/routes.const'
import { API_ENDPOINT } from '../../../src/enums/api-endpoint.enum'
import type { IApiRoute } from '../../../src/interfaces/api-route.interface'
import { LAYOUT } from '../../../src/enums/layout.enum'
import type { IPageDelivery } from '../../../src/interfaces/page-delivery.interface'
import type { INavigationGroup, INavigationItem } from '../../../src/interfaces/navigation.interface'
import {
  filterDeliveredGroups,
  filterDeliveredItems,
  findDeliveredPendingUsages,
  findPagePendingTickets,
  findOrphanEndpoints,
  findStalePages,
  findUndeclaredPages,
  isPageAccessible,
  normalizeRoutePath
} from '../../../src/utils/page-delivery.util'

const PAGES_DIRECTORY = join(process.cwd(), 'src/pages')

const listPageFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? listPageFiles(join(directory, entry.name)) : entry.name.endsWith('.vue') ? [join(directory, entry.name)] : [])

/** `editions/[id].vue` -> `/editions/:id`, `editions/index.vue` -> `/editions`, `index.vue` -> `/`. */
const toRoute = (file: string): string =>
  normalizeRoutePath(`/${relative(PAGES_DIRECTORY, file)}`
    .replace(/\.vue$/, '')
    .replace(/\/index$/, '')
    .replace(/\[(\w+)\]/g, ':$1'))

const pageRoutes = listPageFiles(PAGES_DIRECTORY).map(toRoute)

const table = (delivered: boolean): Record<string, IPageDelivery> => ({
  '/a': { delivered, layout: LAYOUT.DEFAULT, endpoints: [API_ENDPOINT.EDITIONS] },
  '/b': { delivered: false, layout: LAYOUT.DEFAULT, endpoints: [API_ENDPOINT.STATS] }
})

/** Table de routes de test : les endpoints listés n'ont pas encore de route (ticket `B-99`). */
const routes = (pending: API_ENDPOINT[]): Record<API_ENDPOINT, IApiRoute> =>
  Object.fromEntries(Object.values(API_ENDPOINT).map(endpoint =>
    [endpoint, pending.includes(endpoint) ? { file: 'x.get.ts', pendingTicket: 'B-99' } : { file: 'x.get.ts' }])) as Record<API_ENDPOINT, IApiRoute>

describe('table PAGE_DELIVERY', () => {
  it('déclare chaque page de src/pages, routes dynamiques comprises', () => {
    expect(pageRoutes).toEqual(expect.arrayContaining([ROUTES.EDITION, ROUTES.PLAYER, ROUTES.INVITATION, ROUTES.HOME]))
    expect(findUndeclaredPages(pageRoutes)).toEqual([])
  })

  it('ne garde aucune entrée sans page', () => {
    expect(findStalePages(pageRoutes)).toEqual([])
  })

  it('rattache chaque endpoint à au moins une page', () => {
    expect(findOrphanEndpoints()).toEqual([])
  })

  it('ne déclare que des endpoints connus', () => {
    const known = new Set(Object.values(API_ENDPOINT))
    for (const page of Object.values(PAGE_DELIVERY)) {
      for (const endpoint of page.endpoints) {
        expect(known.has(endpoint)).toBe(true)
      }
    }
  })

  it('seules la page Plus de l’admin (T-LIVE-01) et la page Édition (F-03) sont livrées, toutes les autres sont masquées en production', () => {
    const delivered = Object.entries(PAGE_DELIVERY).filter(([, page]) => page.delivered).map(([route]) => route)
    expect(delivered.sort()).toEqual([ROUTES.ADMIN_MORE, ROUTES.EDITION].sort())
  })
})

describe('détection des erreurs de table', () => {
  it('signale une page sans entrée, une entrée sans page et un endpoint orphelin', () => {
    expect(findUndeclaredPages(['/a', '/c'], table(true))).toEqual(['/c'])
    expect(findStalePages(['/a'], table(true))).toEqual(['/b'])
    expect(findOrphanEndpoints(table(true))).toContain(API_ENDPOINT.COMPETITORS)
    expect(findOrphanEndpoints(table(true))).not.toContain(API_ENDPOINT.ME)
  })

  it('reconnaît une route vue-router et ses variantes', () => {
    expect(normalizeRoutePath('/editions/:id()')).toBe('/editions/:id')
    expect(normalizeRoutePath('/editions/')).toBe('/editions')
    expect(normalizeRoutePath('/regles#variantes')).toBe('/regles')
    expect(normalizeRoutePath('')).toBe('/')
  })
})

describe('garde de release par page livrée (OPS-3, ARCH-8)', () => {
  it('une page livrée qui consomme un endpoint sans route est signalée, avec le ticket back', () => {
    expect(findDeliveredPendingUsages(table(true), routes([API_ENDPOINT.EDITIONS]))).toEqual([
      { page: '/a', endpoint: API_ENDPOINT.EDITIONS, ticket: 'B-99' }
    ])
  })

  it('les endpoints du layout comptent : ME sans route bloque une page livrée sans endpoint propre', () => {
    const pages: Record<string, IPageDelivery> = { '/a': { delivered: true, layout: LAYOUT.DEFAULT, endpoints: [] } }
    expect(findDeliveredPendingUsages(pages, routes([API_ENDPOINT.ME]))).toEqual([{ page: '/a', endpoint: API_ENDPOINT.ME, ticket: 'B-99' }])
  })

  it('une page admin livrée hérite d’EDITIONS (sélecteur d’édition du layout)', () => {
    const pages: Record<string, IPageDelivery> = { '/admin/x': { delivered: true, layout: LAYOUT.ADMIN, endpoints: [] } }
    expect(LAYOUT_ENDPOINTS[LAYOUT.ADMIN]).toContain(API_ENDPOINT.EDITIONS)
    expect(findDeliveredPendingUsages(pages, routes([API_ENDPOINT.EDITIONS]))).toEqual([
      { page: '/admin/x', endpoint: API_ENDPOINT.EDITIONS, ticket: 'B-99' }
    ])
  })

  it('toute page admin de la table hérite des endpoints du layout admin', () => {
    const adminPages = Object.entries(PAGE_DELIVERY).filter(([path]) => path.startsWith('/admin'))
    expect(adminPages.length).toBeGreaterThan(0)
    for (const [, page] of adminPages) {
      expect(page.layout).toBe(LAYOUT.ADMIN)
    }
  })

  it('passe quand toutes les routes d’une page livrée existent', () => {
    expect(findDeliveredPendingUsages(table(true), routes([]))).toEqual([])
  })

  it('ignore une page non livrée', () => {
    expect(findDeliveredPendingUsages(table(false), routes([API_ENDPOINT.EDITIONS]))).toEqual([])
  })

  it('liste les tickets back qu’attend une page, layout compris', () => {
    expect(findPagePendingTickets('/a', table(true), routes([API_ENDPOINT.EDITIONS, API_ENDPOINT.ME]))).toEqual(['B-99'])
    expect(findPagePendingTickets('/a', table(true), routes([]))).toEqual([])
    expect(findPagePendingTickets('/inconnue', table(true), routes([]))).toEqual([])
  })
})

describe('masquage en production', () => {
  const items: INavigationItem[] = [
    { key: 'k.a', label: 'A', to: '/a' },
    { key: 'k.b', label: 'B', to: '/b' }
  ]
  const delivered: Record<string, IPageDelivery> = {
    '/a': { delivered: true, layout: LAYOUT.DEFAULT, endpoints: [] },
    '/b': { delivered: false, layout: LAYOUT.DEFAULT, endpoints: [] }
  }

  it('en production, seule une page livrée est accessible', () => {
    expect(isPageAccessible('/a', false, delivered)).toBe(true)
    expect(isPageAccessible('/b', false, delivered)).toBe(false)
    expect(isPageAccessible('/inconnue', false, delivered)).toBe(false)
  })

  it('en dev et en test, tout est accessible', () => {
    expect(isPageAccessible('/b', true, delivered)).toBe(true)
  })

  it('retire des entrées de navigation les pages non livrées, et les groupes vides', () => {
    expect(filterDeliveredItems(items, false, delivered).map(item => item.to)).toEqual(['/a'])
    expect(filterDeliveredItems(items, true, delivered)).toHaveLength(2)
    const groups: INavigationGroup[] = [
      { key: 'g.1', label: 'G1', items },
      { key: 'g.2', label: 'G2', items: [items[1]!] }
    ]
    expect(filterDeliveredGroups(groups, false, delivered).map(group => group.key)).toEqual(['g.1'])
  })
})
