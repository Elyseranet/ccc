import { test } from '@playwright/test'
import { alignToPixel, HOME_VIEWPORTS, prepareHomeComparison } from '../e2e/helpers/home-visual'
import { box, compare, open } from '../e2e/visual.util'

/*********************************************************
 * Accueil sans les liens vers le palmarès : comparaison visuelle sur le conteneur de production (T-REL-02, decisions.md ab1a6b4)
 *
 * @description
 * Tant que `/palmares` n'est pas livré, l'accueil masque le bouton secondaire du hero, le lien « voir le classement » et le lien de la
 * tuile du champion : seule la production applique la garde (`nuxt dev` laisse tout visible), d'où cette mesure dans la suite de release,
 * sur `E2E_BASE_URL`. Même mécanisme que `visual/F-01.spec.ts` (`visual.util`, mêmes textes réels et mêmes masques de valeurs, seuil de 1 %),
 * contre la maquette `index.html?sans-palmares`. Zones : le hero (un seul bouton), la tuile du champion (non cliquable) et la tuile du
 * classement (sans le lien).
 ********************************************************/
const MOCKUP_FILE = 'index.html?sans-palmares'
const ZONES = [
  { name: 'accueil-sans-palmares-hero', mock: '.home-hero', app: '[data-cy="home-hero"]' },
  { name: 'accueil-sans-palmares-tuile-champion', mock: '.t-champ', app: '[data-cy="home-tile-champion"]' },
  { name: 'accueil-sans-palmares-tuile-classement', mock: '.t-rank', app: '[data-cy="home-tile-ranking"]' }
]

for (const viewport of HOME_VIEWPORTS) {
  test.describe(`accueil sans palmarès @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser }) => {
        const { mockup, mockContext } = await open(page, browser, viewport, MOCKUP_FILE, '/')
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
