import { test } from '@playwright/test'
import { box, compare, open } from '../visual.util'

/*********************************************************
 * Tirages reconstitués d'une édition archivée (F-35, DRAWS-ARCH) : comparaison visuelle par zone (FA-04, ARCH-9)
 *
 * @description
 * Édition 2025 des archives (close, sans tirage enregistré), comparée à `edition.html?tirages=reconstitue` ; édition 2024 (avec un tour de
 * barrages) comparée à `edition.html?tirages=reconstitue&barrages`. Les zones comparées ne dépendent d'aucune donnée : l'alerte, les titres
 * et leur pastille, les notes, l'en-tête d'une poule et d'une carte de tour. La composition des poules et les listes d'affiches portent
 * des noms et un nombre de joueurs qui viennent des archives (la maquette en dessine six par poule) : elles sont couvertes par les tests
 * d'unité et de composant. L'édition 2013 (aucune poule) n'a pas de carte de composition : seule l'alerte, pleine largeur comme dans la maquette, est comparée. Seuil : 1 % par zone.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const ZONES = [
  { zone: 'rec-alerte', code: '2025', mockQuery: '', mockup: '.tir-rec__note', app: '[data-cy="edition-draws-reconstituted"]' },
  { zone: 'rec-alerte-sans-poule', code: '2013', mockQuery: '', mockup: '.tir-rec__note', app: '[data-cy="edition-draws-reconstituted"]' },
  { zone: 'rec-poules-entete', code: '2025', mockQuery: '', mockup: '.tir-rec .tir__pools .draw__head', app: '[data-cy="edition-draws-rec-pools"] .edition-draws__head' },
  { zone: 'rec-poules-note', code: '2025', mockQuery: '', mockup: '.tir-rec .tir__pools > p.muted', app: '[data-cy="edition-draws-rec-pools"] .edition-draws__note' },
  { zone: 'rec-poule-titre', code: '2025', mockQuery: '', mockup: '.tir-rec .rec-pool:first-child .rec-pool__t', app: '[data-cy="edition-rec-pool-1"] .edition-draws__rec-pool-title' },
  { zone: 'rec-affiches-titre', code: '2025', mockQuery: '', mockup: '.tir-rec .tir__rounds > h3', app: '.edition-draws__rounds > .edition-draws__title' },
  { zone: 'rec-affiches-note', code: '2025', mockQuery: '', mockup: '.tir-rec .tir__rounds > p.muted', app: '.edition-draws__rounds > .edition-draws__note' },
  { zone: 'rec-huitiemes-entete', code: '2025', mockQuery: '', mockup: '.tir-rec .draws .draw:not([hidden]) .draw__head', app: '[data-cy="edition-rec-draw-round-of-16"] .edition-draws__head' },
  { zone: 'rec-barrages-entete', code: '2024', mockQuery: '&barrages', mockup: '.draw--playoff .draw__head', app: '[data-cy="edition-rec-draw-playoff"] .edition-draws__head' }
]

const equalizeHeights = async (mockup: import('@playwright/test').Page, page: import('@playwright/test').Page) => {
  const heights = await Promise.all([mockup, page].map(target => target.evaluate(() => document.documentElement.scrollHeight)))
  const height = Math.max(...heights)
  for (const target of [mockup, page]) {
    await target.evaluate((value) => {
      document.body.style.minHeight = `${value}px`
    }, height)
  }
}

const alignToPixel = async (target: import('@playwright/test').Page, selector: string) => {
  await target.evaluate((value) => {
    const element = document.querySelector(value) as HTMLElement
    const top = element.getBoundingClientRect().top + window.scrollY
    const delta = Math.ceil(top) - top
    element.style.marginTop = `calc(${getComputedStyle(element).marginTop} + ${delta}px)`
  }, selector)
}

for (const viewport of VIEWPORTS) {
  test.describe(`tirages reconstitués @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const entry of ZONES) {
      test(entry.zone, async ({ page, browser }) => {
        const { mockup, mockContext } = await open(page, browser, viewport, `edition.html?tirages=reconstitue${entry.mockQuery}`, `/editions/${entry.code}?onglet=tirages`)
        await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await equalizeHeights(mockup, page)
        await alignToPixel(mockup, entry.mockup)
        await alignToPixel(page, entry.app)
        await compare(page, mockup, entry.zone, viewport.name, await box(mockup, entry.mockup), await box(page, entry.app))
        await mockContext.close()
      })
    }
  })
}
