import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { pairUrl, resolvePair } from '../helpers/head-to-head'
import type { IPairIds } from '../helpers/head-to-head'
import { alignMockupText, box, compare, open } from '../visual.util'
import type { ITextPair } from '../visual.util'

/*********************************************************
 * Face-à-face : comparaison visuelle par zone (FA-04, ARCH-9)
 *
 * @description
 * L'application tourne sur les vraies données (paire de référence des archives, 4 rencontres, 2 victoires chacun comme la
 * maquette). Seules les VALEURS de données sont masquées des deux côtés, en rendant leur encre transparente (noms,
 * initiales, scores, compteurs, édition, tour) : filet, fond, rayon, gabarit et positions restent comparés.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const MOCKUP_INK = [
  '.ff-duel__n', '.ff-duel__side span:last-child', '.ff-duel__score span', '.ff-duel .muted',
  '.ff-player__av', '.ff-player h3 a', '.ff-player h3 .stars', '.ff-stats dd',
  '.table tbody td', '.table tbody td a', '.table tbody td .stars', '.ff-pick .input'
]
const APP_INK = [
  '[data-cy="head-to-head-wins-a"]', '[data-cy="head-to-head-wins-b"]', '.head-to-head-summary__side span:last-child',
  '[data-cy="head-to-head-score"] span', '[data-cy="head-to-head-meetings"]',
  '.head-to-head-summary__avatar', '.head-to-head-summary__name *', '.origam-data-list__kv-value',
  '[data-cy="head-to-head-table"] tbody td', '[data-cy="head-to-head-table"] tbody td *',
  '[data-cy^="head-to-head-player-"] .origam-select__selection-text', '[data-cy^="head-to-head-player-"] input'
]
const TEXT_PAIRS: ITextPair[] = [
  { mockup: '.ff-duel__n', app: '[data-cy="head-to-head-wins-a"], [data-cy="head-to-head-wins-b"]' },
  { mockup: '.ff-duel__side > span:last-child', app: '.head-to-head-summary__side > span:last-child' },
  { mockup: '.ff-duel__score > span', app: '[data-cy="head-to-head-score"] > span' },
  { mockup: '.ff-duel .muted', app: '[data-cy="head-to-head-meetings"]' },
  { mockup: '.ff-player h3 a', app: '.head-to-head-summary__name .player-link__name' },
  { mockup: '.ff-player__av', app: '.head-to-head-summary__avatar' },
  { mockup: '.ff-stats dd', app: '.origam-data-list__kv-value' },
  { mockup: '.table tbody td:nth-child(1)', app: '[data-cy="head-to-head-table"] tbody td:nth-child(1)' },
  { mockup: '.table tbody td:nth-child(2)', app: '[data-cy="head-to-head-table"] tbody td:nth-child(2)' },
  { mockup: '.table tbody td:nth-child(3)', app: '[data-cy="head-to-head-table"] tbody td:nth-child(3)' },
  { mockup: '.table tbody td.win a', app: '[data-cy="head-to-head-table"] .player-link__name' },
  { mockup: '.ff-note', app: '[data-cy="head-to-head-note"]' }
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

const ZONES = [
  { zone: 'ff-hero', mockup: '.ff-hero', mockupFrom: '.pl-crumbs', app: '.page-hero' },
  { zone: 'ff-choix', mockup: '.ff-pick', app: '[data-cy="head-to-head-picker"]' },
  { zone: 'ff-duel', mockup: '.ff-duel', app: '.head-to-head-summary__duel' },
  { zone: 'ff-bilans', mockup: 'section[aria-labelledby="h-glob"]', app: '[data-cy="head-to-head-bilans"]' },
  { zone: 'ff-rencontres', mockup: 'section[aria-labelledby="h-meet"]', app: '[data-cy="head-to-head-history"]' }
]

let ids: IPairIds
test.beforeAll(async ({ request }) => {
  ids = await resolvePair(request)
})

for (const viewport of VIEWPORTS) {
  test.describe(`face-à-face @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const entry of ZONES) {
      test(entry.zone, async ({ page, browser }) => {
        const { mockup, mockContext } = await open(page, browser, viewport, 'face-a-face.html', pairUrl(ids.a, ids.b))
        await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
        await alignMockupText(mockup, page, TEXT_PAIRS)
        await hideInk(mockup, MOCKUP_INK)
        await hideInk(page, APP_INK)
        await alignToPixel(mockup, entry.mockupFrom ?? entry.mockup)
        await alignToPixel(page, entry.app)
        const mockBox = await box(mockup, entry.mockup)
        if (entry.mockupFrom) {
          const from = await box(mockup, entry.mockupFrom)
          mockBox.height = mockBox.y + mockBox.height - from.y
          mockBox.y = from.y
        }
        const appBox = await box(page, entry.app)
        await compare(page, mockup, entry.zone, viewport.name, mockBox, appBox)
        await mockContext.close()
      })
    }
  })
}
