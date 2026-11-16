import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { alignMockupText, box, compare, open, settle } from '../visual.util'
import type { IClip, ITextPair } from '../visual.util'

/*********************************************************
 * Édition, onglets Poules, Bracket et Matchs (F-03b) : comparaison visuelle par zone (FA-04, ARCH-9)
 *
 * @description
 * Édition 2025 des archives (réelle, close) contre `edition.html`. Les textes de l'application (noms, scores, nombres, tours)
 * sont écrits dans la maquette en mémoire (`alignMockupText`) : les deux côtés affichent le même texte, donc les mêmes largeurs
 * de colonne, et seuls le gabarit, le filet, le fond, le rayon et les positions sont comparés. Les poules des archives ont 7 et 6
 * joueurs, celles de la maquette 6 et 5 : on compare l'en-tête et la première ligne de chaque tableau, après avoir masqué les
 * lignes en trop côté application. Les étoiles de titres de la maquette sont retirées (B-19, titres à date non exposés).
 ********************************************************/
const EDITION_CODE = '2025'
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'
const hideInk = async (page: Page, selectors: string[]) => {
  await page.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

const alignToPixel = async (page: Page, selector: string) => {
  await page.evaluate((target) => {
    const element = document.querySelector(target) as HTMLElement
    const top = element.getBoundingClientRect().top + window.scrollY
    const delta = Math.ceil(top) - top
    element.style.marginTop = `calc(${getComputedStyle(element).marginTop} + ${delta}px)`
  }, selector)
}

/** Boîte allant du haut d'un conteneur au bas de son premier élément `end` (en-tête et première ligne d'un tableau). */
const boxToFirst = async (page: Page, container: string, end: string): Promise<IClip> => {
  const found = await page.evaluate(([containerSelector, endSelector]) => {
    const root = document.querySelector(containerSelector as string) as HTMLElement
    const last = root.querySelector(endSelector as string) as HTMLElement
    const a = root.getBoundingClientRect()
    const b = last.getBoundingClientRect()
    return { x: a.left + window.scrollX, y: a.top + window.scrollY, width: a.width, height: b.bottom - a.top }
  }, [container, end])
  return found
}

const POOL_PAIRS: ITextPair[] = [
  { mockup: '#ed-p-pou .pool-note', app: '.edition-groups__note' },
  { mockup: '.pools .table-wrap:first-child caption', app: '[data-cy="edition-pool-1"] caption' },
  { mockup: '.pools .table-wrap:first-child tbody tr td:nth-child(1)', app: '[data-cy="edition-pool-1"] tbody tr td:nth-child(1)' },
  { mockup: '.pools .table-wrap:first-child tbody tr td:nth-child(2) a', app: '[data-cy="edition-pool-1"] tbody tr td:nth-child(2) .player-link__name' },
  { mockup: '.pools .table-wrap:first-child tbody tr td:nth-child(3)', app: '[data-cy="edition-pool-1"] tbody tr td:nth-child(3)' },
  { mockup: '.pools .table-wrap:first-child tbody tr td:nth-child(4)', app: '[data-cy="edition-pool-1"] tbody tr td:nth-child(4)' },
  { mockup: '.pools .table-wrap:first-child tbody tr td:nth-child(5)', app: '[data-cy="edition-pool-1"] tbody tr td:nth-child(5)' },
  { mockup: '.pools .table-wrap:first-child tbody tr td:nth-child(6)', app: '[data-cy="edition-pool-1"] tbody tr td:nth-child(6)' },
  { mockup: '.pools .table-wrap:first-child tbody tr td:nth-child(7)', app: '[data-cy="edition-pool-1"] tbody tr td:nth-child(7)' }
]
const MATCH_PAIRS: ITextPair[] = [
  { mockup: '#ed-p-mat tbody tr td:nth-child(1)', app: '[data-cy="edition-matches-table"] tbody tr td:nth-child(1)' },
  { mockup: '#ed-p-mat tbody tr td:nth-child(2)', app: '[data-cy="edition-matches-table"] tbody tr td:nth-child(2)' },
  { mockup: '#ed-p-mat tbody tr td:nth-child(3) a', app: '[data-cy="edition-matches-table"] tbody tr td:nth-child(3) .player-link__name' },
  { mockup: '#ed-p-mat tbody tr td:nth-child(4)', app: '[data-cy="edition-matches-table"] tbody tr td:nth-child(4)' },
  { mockup: '#ed-p-mat tbody tr td:nth-child(5) a', app: '[data-cy="edition-matches-table"] tbody tr td:nth-child(5) .player-link__name' },
  { mockup: '.fchip .num', app: '[data-cy^="edition-matches-filter-"] .filter-chips__count' },
  { mockup: '#ed-p-mat .pager .num', app: '[data-cy="edition-matches-range"]' }
]
const MOCKUP_INK = [
  '.pools .table tbody td', '.pools .table tbody td a', '.pools caption', '#ed-p-mat tbody td', '#ed-p-mat tbody td a', '.fchip .num', '#ed-p-mat .pager .num',
  '.bk .stars'
]
const APP_INK = [
  '[data-cy^="edition-pool-"] tbody td', '[data-cy^="edition-pool-"] tbody td *', '[data-cy^="edition-pool-"] caption',
  '[data-cy="edition-matches-table"] tbody td', '[data-cy="edition-matches-table"] tbody td *', '[data-cy="edition-matches-range"]'
]

const ZONES = [
  { zone: 'poules-note', tab: 'edition-tab-pools', mockTab: '#ed-t-pou', mockup: '#ed-p-pou .pool-note', app: '.edition-groups__note' },
  { zone: 'poules-tableau', tab: 'edition-tab-pools', mockTab: '#ed-t-pou', mockup: '.pools .table-wrap:first-child', app: '[data-cy="edition-pool-1"]', upTo: 'tbody tr' },
  { zone: 'bracket-note', tab: 'edition-tab-bracket', mockTab: '#ed-t-bra', mockup: '#ed-p-bra .pool-note', app: '.edition-bracket__note' },
  { zone: 'matchs-filtres', tab: 'edition-tab-matches', mockTab: '#ed-t-mat', mockup: '.m-filters', app: '[data-cy="edition-matches-filters"]' },
  { zone: 'matchs-tableau', tab: 'edition-tab-matches', mockTab: '#ed-t-mat', mockup: '#ed-p-mat .table-wrap', app: '[data-cy="edition-matches-scroll"]' },
  { zone: 'matchs-pagination', tab: 'edition-tab-matches', mockTab: '#ed-t-mat', mockup: '#ed-p-mat .pager', app: '[data-cy="edition-matches-pagination"]' }
]

for (const viewport of VIEWPORTS) {
  test.describe(`édition poules, bracket, matchs @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const entry of ZONES) {
      test(entry.zone, async ({ page, browser }) => {
        const { mockup, mockContext } = await open(page, browser, viewport, 'edition.html', `/editions/${EDITION_CODE}`)
        await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
        await page.getByTestId(entry.tab).click()
        await mockup.locator(entry.mockTab).click()
        await mockup.addStyleTag({ content: '.stars { display: none !important; }' })
        await alignMockupText(mockup, page, [...POOL_PAIRS, ...MATCH_PAIRS])
        if (entry.zone === 'poules-tableau') {
          await page.addStyleTag({ content: '[data-cy="edition-pool-1"] tbody tr:nth-child(n+7) { display: none !important; }' })
        }
        await hideInk(mockup, MOCKUP_INK)
        await hideInk(page, APP_INK)
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await alignToPixel(mockup, entry.mockup)
        await alignToPixel(page, entry.app)
        const mockBox = entry.upTo ? await boxToFirst(mockup, entry.mockup, entry.upTo) : await box(mockup, entry.mockup)
        const appBox = entry.upTo ? await boxToFirst(page, entry.app, entry.upTo) : await box(page, entry.app)
        await compare(page, mockup, entry.zone, viewport.name, mockBox, appBox)
        await mockContext.close()
      })
    }

    /**
     * Tableau des phases finales : exception approuvée par l'utilisateur (F-03-BRK bis, 2026-11-12). Le rendu `origam-bracket` s'écarte de la maquette
     * (Elyseranet/origam#1282) ; la référence est une capture Playwright du rendu validé, relue par un humain et versionnée dans
     * `tests/e2e/__screenshots__`. Elle n'est régénérée (`--update-snapshots`) que pour un changement voulu du tableau ou du thème.
     */
    test('bracket (capture de référence, rendu origam-bracket validé)', async ({ page }) => {
      await page.goto(`/editions/${EDITION_CODE}`)
      await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
      await page.getByTestId('edition-tab-bracket').click()
      const region = page.getByTestId('edition-bracket-region')
      await expect(region).toBeVisible()
      // En-tête et onglets collants, halo fixe du fond : ils passeraient sur la capture selon le défilement. Seul le tableau est la référence.
      await page.addStyleTag({ content: '.public-shell__header, .edition-page__tabs { position: static !important; } .public-shell::before { display: none !important; }' })
      // La souris reste sur la page après le clic sur l'onglet : un match en état survol serait capturé.
      await page.mouse.move(0, 0)
      await settle(page)
      await expect(region).toHaveScreenshot(`bracket-${viewport.name}.png`, { animations: 'disabled' })
    })
  })
}
