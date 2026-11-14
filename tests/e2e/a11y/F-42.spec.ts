import { expect, test } from '@playwright/test'
import { resolvePair } from '../helpers/head-to-head'

/*********************************************************
 * F-42 : le fil d'Ariane reste cliquable sous le titre
 *
 * @description
 * Mesure du 2026-11-14 : à 1440 px, la boîte de contenu du texte du titre (police display de 119 px, `line-height: none`, 172 px de haut pour une boîte de 105 px) débordait de 34 px sur le fil d'Ariane des pages
 * d'édition et recevait les clics (cible du mousedown : le h1, aucune navigation). Le test fait un vrai clic de souris au centre de chaque lien et vérifie que la cible de l'événement est le lien : le `click({ trial })` de Playwright ne voit pas
 * ce défaut. Les pages sans lien d'Ariane sous un titre de cette taille (légales, face-à-face) sont mesurées par la même méthode dans le ticket.
 ********************************************************/
const VIEWPORTS = [{ name: '1440', width: 1440, height: 900 }, { name: '390', width: 390, height: 844 }]

for (const viewport of VIEWPORTS) {
  test.describe(`fil d'Ariane cliquable @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    const routes = async (request: Parameters<typeof resolvePair>[0]) => ['/editions/2025', '/editions', `/joueurs/${(await resolvePair(request)).a}`]

    test('un vrai clic au centre de chaque lien atteint le lien (édition, liste des éditions, fiche joueur)', async ({ page, request }) => {
      for (const route of await routes(request)) {
        await page.goto(route)
        await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
        const links = page.locator('[data-cy="page-hero-breadcrumb"] a, [data-cy="player-breadcrumb"] a')
        const count = await links.count()
        expect(count, `${route} : au moins un lien d'Ariane`).toBeGreaterThan(0)
        for (let index = 0; index < count; index++) {
          await page.goto(route)
          await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
          const link = page.locator('[data-cy="page-hero-breadcrumb"] a, [data-cy="player-breadcrumb"] a').nth(index)
          const box = (await link.boundingBox())!
          await page.evaluate((position) => {
            const target = document.querySelectorAll('[data-cy="page-hero-breadcrumb"] a, [data-cy="player-breadcrumb"] a')[position]!
            ;(window as unknown as { __hit: string | null }).__hit = null
            document.addEventListener('mousedown', (event) => {
              ;(window as unknown as { __hit: string | null }).__hit = target.contains(event.target as Node) ? 'lien' : `${(event.target as Element).tagName.toLowerCase()}.${String((event.target as Element).className).split(' ')[0]}`
            }, { capture: true, once: true })
          }, index)
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
          expect(await page.evaluate(() => (window as unknown as { __hit: string | null }).__hit), `${route} : cible du clic au centre du lien ${index + 1} du fil d'Ariane`).toBe('lien')
        }
      }
    })
  })
}
