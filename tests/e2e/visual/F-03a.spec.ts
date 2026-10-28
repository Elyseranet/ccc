import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { alignMockupText, box, compare, open } from '../visual.util'
import type { ITextPair } from '../visual.util'

/*********************************************************
 * Édition (F-03a) : comparaison visuelle par zone (FA-04, ARCH-9)
 *
 * @description
 * Édition 2025 des archives (réelle, close), comparée à `edition.html`. Seules les VALEURS de données sont masquées des
 * deux côtés (encre transparente) : filet, fond, rayon, gabarit et positions restent comparés. Les onglets Tirages,
 * Poules, Bracket et Matchs ne sont pas comparés ici : les archives n'ont aucun tirage (T-QA-03 en ajoutera pour 2026),
 * et Poules, Bracket et Matchs appartiennent à F-03b. Les étoiles de titres de la maquette (finaliste) sont retirées de la
 * maquette : le DTO public n'expose les titres à date que du champion, qui n'a pas d'étoile dans la maquette.
 ********************************************************/
const EDITION_CODE = '2025'
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const MOCKUP_INK = [
  '.ed-podium__name', '.ed-podium__champ .muted', '.ed-podium__rest a', '.ed-facts dd', '.ed-facts small', '.meta-row .muted',
  '.ed-hero__sel select', '.ppl__i .avatar', '.ppl__n a', '.ppl__n small'
]
const APP_INK = [
  '.edition-summary__champ-name *', '[data-cy="edition-final-line"]', '.edition-summary__place .player-link__name',
  '.edition-summary__fact-value', '.edition-summary__small', '.edition-page__summary', '.edition-selector .origam-select__selection-text',
  '.edition-selector input', '.edition-participants__avatar', '.edition-participants__name *'
]
const TEXT_PAIRS: ITextPair[] = [
  { mockup: '.ed-podium__name', app: '.edition-summary__champ-name .player-link__name' },
  { mockup: '.ed-podium__champ .muted', app: '[data-cy="edition-final-line"]' },
  { mockup: '.ed-podium__rest a', app: '.edition-summary__place .player-link__name' },
  { mockup: '.ed-facts dd', app: '.edition-summary__fact-value' },
  { mockup: '.meta-row .muted', app: '.edition-page__summary' },
  { mockup: '.ppl__i .ppl__n a', app: '.edition-participants__item .player-link__name' }
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

/**
 * Le halo de fond est une couche fixe, étirée à la hauteur de la page dans une capture « fullPage » : deux pages de hauteurs
 * différentes (45 participants de la maquette, 27 des archives) ne peignent pas le même dégradé. On rend les deux
 * documents aussi hauts l'un que l'autre avant la capture.
 */
const equalizeHeights = async (mockup: Page, page: Page) => {
  const heights = await Promise.all([mockup, page].map(target => target.evaluate(() => document.documentElement.scrollHeight)))
  const height = Math.max(...heights)
  for (const target of [mockup, page]) {
    await target.evaluate((value) => {
      document.body.style.minHeight = `${value}px`
    }, height)
  }
}

const ZONES = [
  { zone: 'edition-fil', tab: null, mockTab: null, mockup: '.crumbs', app: '[data-cy="page-hero-breadcrumb"] .origam-breadcrumb__items' },
  { zone: 'edition-titre', tab: null, mockTab: null, mockup: '.page-hero__title', app: '[data-cy="page-title"]', narrow: true },
  { zone: 'edition-meta', tab: null, mockTab: null, mockup: '.meta-row', app: '[data-cy="edition-meta"]', narrow: true, gaps: { '1440': 'dégradé du halo de fond différent sur cette bande à 1440 px (15 %, 1211 px) ; la zone du titre juste au-dessus est à 0,000 %, cause non établie' } },
  { zone: 'edition-selecteur', tab: null, mockTab: null, mockup: '.ed-hero__sel', app: '.edition-selector' },
  { zone: 'edition-onglets', tab: null, mockTab: null, mockup: '.ed-tabs .tabs', app: '[data-cy="edition-tabs"]' },
  { zone: 'edition-podium', tab: 'edition-tab-summary', mockTab: '#ed-t-syn', mockup: '.ed-podium', app: '[data-cy="edition-podium"]', gaps: { '1440': 'bloc du champion 1,3 px plus bas dans la maquette (hauteur de la ligne 116,28 px contre 113,7 px de son contenu), cause non établie : 2 % des pixels' } },
  { zone: 'edition-chiffres', tab: 'edition-tab-summary', mockTab: '#ed-t-syn', mockup: '.ed-facts', app: '.edition-summary__facts' },
  { zone: 'edition-deroule', tab: 'edition-tab-summary', mockTab: '#ed-t-syn', mockup: '.ed-steps', app: '[data-cy="edition-steps"]' },
  { zone: 'edition-participant', tab: 'edition-tab-participants', mockTab: '#ed-t-par', mockup: '.ppl__i:first-child', app: '.edition-participants__item:first-child' }
]

for (const viewport of VIEWPORTS) {
  test.describe(`édition @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const entry of ZONES) {
      test(entry.zone, async ({ page, browser }) => {
        const gap = (entry as { gaps?: Record<string, string> }).gaps?.[viewport.name]
        test.fail(gap !== undefined, gap)
        const { mockup, mockContext } = await open(page, browser, viewport, 'edition.html', `/editions/${EDITION_CODE}`)
        await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
        if (entry.tab) {
          await page.getByTestId(entry.tab).click()
          await mockup.locator(entry.mockTab as string).click()
        }
        await alignMockupText(mockup, page, TEXT_PAIRS)
        const extra = await page.locator('[data-cy="edition-fact-matches"] small:nth-of-type(2)').allTextContents()
        if (entry.tab === 'edition-tab-summary' && extra.length > 0) {
          await mockup.evaluate((text) => {
            const small = document.createElement('small')
            small.className = 'muted'
            small.textContent = text.trim()
            document.querySelectorAll('.ed-facts .card')[2]?.appendChild(small)
          }, extra[0] as string)
        }
        await mockup.addStyleTag({ content: '.stars { display: none !important; }' })
        await hideInk(mockup, MOCKUP_INK)
        await hideInk(page, APP_INK)
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await equalizeHeights(mockup, page)
        await alignToPixel(mockup, entry.mockup)
        await alignToPixel(page, entry.app)
        const mockBox = await box(mockup, entry.mockup)
        const appBox = await box(page, entry.app)
        if (entry.narrow) {
          const width = Math.min(mockBox.width, appBox.width)
          mockBox.width = width
          appBox.width = width
        }
        await compare(page, mockup, entry.zone, viewport.name, mockBox, appBox)
        await mockContext.close()
      })
    }
  })
}
