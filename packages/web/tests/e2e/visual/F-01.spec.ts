import { test } from '@playwright/test'
import { alignToPixel, HOME_VIEWPORTS, prepareHomeComparison } from '../helpers/home-visual'
import { box, compare, open } from '../visual.util'

/*********************************************************
 * Accueil : comparaison visuelle par zone (FA-04, ARCH-9)
 *
 * @description
 * L'application tourne sur les vraies données de la base de test. Seules les VALEURS de données sont masquées des deux
 * côtés (encre rendue transparente : année, compteurs, noms, scores, points) ; filet, fond, rayon et gabarit restent
 * comparés. Avant la capture, le texte réel de l'application est écrit dans le DOM de la maquette (`alignMockupText`),
 * pour que les deux côtés renvoient à la ligne de la même façon.
 ********************************************************/
const ZONES = [
  { name: 'accueil-hero', mock: '.home-hero', app: '[data-cy="home-hero"]' },
  { name: 'accueil-entete-section', mock: '.section__head', app: '.home-bento__head' },
  { name: 'accueil-tuile-en-cours', mock: '.t-now', app: '[data-cy="home-current"]' },
  { name: 'accueil-regles-d-or', mock: '.ticker', app: '[data-cy="golden-rules"]' },
  { name: 'accueil-tuile-editions', mock: '.t-stat--ed', app: '[data-cy="home-tile-editions"]' },
  { name: 'accueil-tuile-competiteurs', mock: '.t-stat--pl', app: '[data-cy="home-tile-players"]' },
  { name: 'accueil-tuile-champion', mock: '.t-champ', app: '[data-cy="home-tile-champion"]' },
  { name: 'accueil-tuile-matchs', mock: '.t-stat--m', app: '[data-cy="home-tile-matches"]' },
  { name: 'accueil-tuile-classement', mock: '.t-rank', app: '[data-cy="home-tile-ranking"]' },
  { name: 'accueil-tuile-face-a-face', mock: '.t-rule', app: '[data-cy="home-tile-head-to-head"]' }
]

for (const viewport of HOME_VIEWPORTS) {
  test.describe(`accueil @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser }) => {
        const { mockup, mockContext } = await open(page, browser, viewport, 'index.html', '/')
        await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
        await prepareHomeComparison(mockup, page)
        await alignToPixel(mockup, zone.mock)
        await alignToPixel(page, zone.app)
        const mockBox = await box(mockup, zone.mock)
        const appBox = await box(page, zone.app)
        await compare(page, mockup, zone.name, viewport.name, mockBox, appBox)
        await mockContext.close()
      })
    }
  })
}
