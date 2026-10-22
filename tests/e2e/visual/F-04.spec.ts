import { test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { box, compare, open } from '../visual.util'
import type { IClip } from '../visual.util'

/*********************************************************
 * F-04 : joueurs et fiche joueur, contre joueurs.html et joueur.html
 *
 * @description
 * L'application tourne sur les vraies données (ARCH-9) : les valeurs (noms, compteurs, pastilles, barres du parcours,
 * lignes) diffèrent de la maquette. On ne masque jamais la structure. Les VALEURS de l'application sont recopiées dans la
 * maquette (mêmes textes, donc mêmes largeurs et mêmes retours à la ligne), sans toucher à la structure, et le parcours et les adversaires sont
 * découpés sur leur structure fixe : en-tête de section, cadre, en-têtes de colonnes, première ligne.
 * Les notes « N matchs au résultat inconnu » (R-5) dépendent des données : elles sont masquées pour garder la même
 * hauteur de ligne ; elles ont leurs tests unitaires.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

type TPair = [mockup: string, app: string]

const mirror = async (page: Page, mockup: Page, pairs: TPair[]) => {
  for (const [mockSelector, appSelector] of pairs) {
    const texts = await page.$$eval(appSelector, elements => elements.map(element => (element as HTMLElement).innerText.trim()))
    await mockup.$$eval(mockSelector, (elements, values) => {
      elements.forEach((element, index) => {
        const value = values[index]
        if (value !== undefined) {
          element.textContent = value
        }
      })
    }, texts)
  }
}

const hide = async (page: Page, selectors: string[]) => {
  if (selectors.length > 0) {
    await page.addStyleTag({ content: `${selectors.join(', ')} { display: none !important; }` })
  }
}

const invisible = async (page: Page, selectors: string[]) => {
  if (selectors.length > 0) {
    await page.addStyleTag({ content: `${selectors.join(', ')} { visibility: hidden !important; }` })
  }
}

interface IZone {
  name: string
  mockup: string
  app: string
  mockWidthFrom?: string
  endMockup?: string
  endApp?: string
}

const round = (clip: IClip): IClip => ({ x: Math.floor(clip.x), y: Math.floor(clip.y), width: Math.ceil(clip.width), height: Math.ceil(clip.height) })

const clipOf = async (page: Page, zone: string, end: string | undefined, widthFrom?: string): Promise<IClip> => {
  const start = await box(page, zone)
  const widthBox = widthFrom ? await box(page, widthFrom) : start
  const bottom = end ? await box(page, end) : start
  return round({ x: widthBox.x, y: start.y, width: widthBox.width, height: end ? bottom.y + bottom.height - start.y : start.height })
}

const PLAYERS_ZONES: IZone[] = [
  { name: 'joueurs-hero', mockup: '.page-hero', app: '.page-hero', mockWidthFrom: '.page-hero .wrap' },
  { name: 'joueurs-recherche', mockup: '.pl-search', app: '[data-cy="players-search"]' },
  { name: 'joueurs-compteur', mockup: '.pl-count', app: '[data-cy="players-count"]' },
  { name: 'joueurs-annuaire', mockup: '.pl-table', app: '[data-cy="players-table"]' },
  { name: 'joueurs-pagination', mockup: '.pager', app: '[data-cy="players-pagination"]' }
]

const PLAYER_ZONES: IZone[] = [
  { name: 'joueur-fil-ariane', mockup: '.pl-crumbs', app: '[data-cy="player-breadcrumb"]' },
  { name: 'joueur-entete', mockup: '.pl-hero', app: '[data-cy="player-header"]' },
  { name: 'joueur-stats', mockup: '.pl-stats', app: '.player-stats__grid' },
  { name: 'joueur-parcours', mockup: 'section[aria-labelledby="h-par"]', app: '[data-cy="player-journey"]', endMockup: '.pl-path thead tr', endApp: '[data-cy="player-journey-table"] thead tr' },
  { name: 'joueur-adversaires', mockup: 'section[aria-labelledby="h-opp"]', app: '[data-cy="player-opponents"]', endMockup: '.opps .opp:first-child', endApp: '[data-cy="player-opponent"]:first-child' },
  { name: 'joueur-adversaires-lien', mockup: '.opps-more', app: '.player-opponents__more' }
]

const neutralCount = async (page: Page, mockup: Page) => {
  const text = '000 joueurs · tri par nom'
  await mockup.$eval('.pl-count', (element, value) => { element.textContent = value }, text)
  await page.$eval('[data-cy="players-count"]', (element, value) => { element.textContent = value }, text)
}

const prepareDirectory = async (page: Page, mockup: Page) => {
  await hide(mockup, ['.pl-cell small', '.pl-cell .stars'])
  await hide(page, ['.players-directory__nickname', '.player-link__stars', '[data-cy="players-unknown-results"]'])
  await neutralCount(page, mockup)
  await mirror(page, mockup, [
    ['.page-hero__lead', '[data-cy="page-hero-lead"]'],
    ['.pl-cell .avatar', '.players-directory__cell .player-avatar'],
    ['.pl-cell > span:last-child a', '.players-directory__cell .player-link__name'],
    ['.table tbody td.num', '.players-directory__num'],
    ['.pager > .num', '[data-cy="players-pager-range"]']
  ])
}

const preparePlayer = async (page: Page, mockup: Page) => {
  await hide(mockup, ['.pl-hero__alias', '.pl-hero .chip .stars', '.opp .stars', '.pl-path .chip'])
  await hide(page, ['[data-cy="player-alias"]', '.player-header__stars', '[data-cy="player-unknown-results"]', '.player-link__stars', '[data-cy="player-journey-table"] .origam-chip'])
  await mirror(page, mockup, [
    ['.crumbs li[aria-current]', '[data-cy="player-breadcrumb"] [aria-current="page"]'],
    ['.pl-hero__name', '[data-cy="page-title"]'],
    ['.pl-hero__avatar', '.player-header__avatar'],
    ['.pl-hero .meta-row .muted', '.player-header__since'],
    ['.pl-hero .chip--amber', '[data-cy="player-titles"]'],
    ['.pl-stat dd', '.player-stats__value'],
    ['.section__head .muted', '.player-journey__lead, .player-opponents__lead'],
    ['.opp .avatar', '.player-opponents__item .player-avatar'],
    ['.opp__n a', '.player-opponents__name .player-link__name'],
    ['.opps-more a', '[data-cy="player-opponents-see-all"]']
  ])
  await invisible(mockup, ['.pchart > li', '.pl-path tbody', '.opp__c', '.opp__r', '.opp__bar'])
  await invisible(page, ['.player-journey__chart > li', '[data-cy="player-journey-table"] tbody', '.player-opponents__count', '.player-opponents__record', '.player-opponents__bar'])
}

const runZones = (title: string, mockupFile: string, resolveRoute: (request: APIRequestContext) => Promise<string>, zones: IZone[], prepare: (page: Page, mockup: Page) => Promise<void>) => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${title} @${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      for (const zone of zones) {
        test(zone.name, async ({ page, browser, request }) => {
          const route = await resolveRoute(request)
          const { mockup, mockContext } = await open(page, browser, viewport, mockupFile, route)
          await prepare(page, mockup)
          const mockClip = await clipOf(mockup, zone.mockup, zone.endMockup, zone.mockWidthFrom)
          const appClip = await clipOf(page, zone.app, zone.endApp)
          await compare(page, mockup, zone.name, viewport.name, mockClip, appClip)
          await mockContext.close()
        })
      }
    })
  }
}

runZones('joueurs.html', 'joueurs.html', async () => '/joueurs', PLAYERS_ZONES, prepareDirectory)

runZones('joueur.html', 'joueur.html', async (request) => {
  const response = await request.get('/api/v1/competiteurs?sort=titles&order=desc&pageSize=1')
  const body = await response.json() as { items: Array<{ id: string }> }
  return `/joueurs/${body.items[0]!.id}`
}, PLAYER_ZONES, preparePlayer)
