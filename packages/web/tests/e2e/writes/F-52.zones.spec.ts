import { expect, test } from '@playwright/test'
import type { Browser } from '@playwright/test'
import { createQualifiedEdition, selectAdminEdition } from '../helpers/edition-write'
import { hydrated, poolEdition, reachPoolEntry } from '../helpers/random-draw'
import { signIn } from '../helpers/session'
import { alignMockupText, compare, MOCKUP_DIR, settle } from '../visual.util'
import type { ITextPair } from '../visual.util'

/*********************************************************
 * F-52 : écran projecteur, comparaison visuelle à la maquette `admin-tirage-projection.html` (état final, 1920 et 1280)
 *
 * @description
 * Pourquoi `writes/` : l'écran se mesure sur une édition créée par le test (QA-3, jamais 2026), après un vrai tirage au sort par l'API. État final : Playwright tourne en
 * `reducedMotion: 'reduce'`, la maquette aussi (`open` de visual.util) : le résultat est affiché sans animation, les rayons à l'arrêt. Les VALEURS (noms, poule, compteur,
 * année) sont recopiées de l'application dans la maquette en mémoire (`alignMockupText`) : la comparaison porte sur le gabarit, la typographie, les couleurs et les positions.
 * La bande de démonstration de la maquette est masquée (`demo=0`). Seuil : 1 % par zone (FA-04).
 ********************************************************/
const VIEWPORTS = [
  { name: '1920', width: 1920, height: 1080 },
  { name: '1280', width: 1280, height: 720 }
]

const commonPairs = (variant: string): ITextPair[] => [
  { mockup: '.hh-brand > span', app: '.draw-projector__brand > span' },
  { mockup: `.pj-step span[data-for="${variant}"]`, app: '[data-cy="draw-projector-step"]' },
  { mockup: `.pj-t span[data-for="${variant}"]`, app: '.draw-projector__title' }
]

const openMockup = async (browser: Browser, viewport: { width: number, height: number }, query: string) => {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  const mockup = await context.newPage()
  await mockup.goto(`file://${MOCKUP_DIR}/admin-tirage-projection.html?${query}`)
  await settle(mockup)
  return { mockup, context }
}

for (const viewport of VIEWPORTS) {
  test.describe(`F-52 écran projecteur @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('affiche (deux noms et « VS »), état final', async ({ page, browser, context }) => {
      test.setTimeout(180_000)
      await signIn(context, 'admin')
      const edition = await createQualifiedEdition(context.request, `zones projecteur ${viewport.name}`, 4)
      await selectAdminEdition(context, edition)
      await page.goto('/admin/phase-finale/tirage')
      await hydrated(page)
      await page.getByTestId('draw-random').click()
      await expect(page.getByTestId('draw-projector')).toBeVisible()
      await expect(page.getByTestId('draw-continue')).toBeFocused()
      // Le bouton de tirage est sous la ligne de flottaison : l'écran fixe se capture avec la page remontée en haut.
      await page.evaluate(() => window.scrollTo(0, 0))
      await settle(page)
      const { mockup, context: mockContext } = await openMockup(browser, viewport, 'v=tour&etat=done&demo=0')
      await alignMockupText(mockup, page, [
        ...commonPairs('tour'),
        { mockup: '.pj-stage[data-for="tour"] .pj-n', app: '.draw-projector__player' }
      ])
      await compare(page, mockup, 'projecteur-affiche', viewport.name, { x: 0, y: 0, width: viewport.width, height: viewport.height }, { x: 0, y: 0, width: viewport.width, height: viewport.height })
      await mockContext.close()
    })

    test('joueur et sa poule, état final', async ({ page, browser, context }) => {
      test.setTimeout(240_000)
      await signIn(context, 'admin')
      const edition = await poolEdition(page, `zones projecteur poule ${viewport.name}`)
      await selectAdminEdition(context, edition)
      await reachPoolEntry(page)
      await page.getByTestId('draw-random').click()
      await expect(page.getByTestId('draw-projector')).toBeVisible()
      await expect(page.getByTestId('draw-continue')).toBeFocused()
      // Le bouton de tirage est sous la ligne de flottaison : l'écran fixe se capture avec la page remontée en haut.
      await page.evaluate(() => window.scrollTo(0, 0))
      await settle(page)
      const { mockup, context: mockContext } = await openMockup(browser, viewport, 'v=poule&etat=done&demo=0')
      await alignMockupText(mockup, page, [
        ...commonPairs('poule'),
        { mockup: '.pj-stage[data-for="poule"] .pj-n', app: '.draw-projector__player' },
        { mockup: '.pj-pool__n', app: '.draw-projector__pool-number' }
      ])
      await compare(page, mockup, 'projecteur-poule', viewport.name, { x: 0, y: 0, width: viewport.width, height: viewport.height }, { x: 0, y: 0, width: viewport.width, height: viewport.height })
      await mockContext.close()
    })
  })
}
