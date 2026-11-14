import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/*********************************************************
 * Régions qui défilent au clavier et niveau de titre de l'invitation (T-A11Y-01 S18 ; WCAG 2.1.1 et axe `heading-order`)
 *
 * @description
 * À 390 px, trois zones défilent horizontalement : le bandeau des règles d'or de l'accueil (S6, rouvert), le tableau du parcours d'un joueur et les
 * tableaux de la page de confidentialité. Chacune doit être focalisable et nommée, sinon un utilisateur du clavier ne peut pas la faire défiler.
 ********************************************************/
test.use({ viewport: { width: 390, height: 844 } })

const PLAYER = '/joueurs/b20dfa9e-222d-46cf-a229-8fd77cc2edca'

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

const expectScrollRegion = async (page: Page, selector: string) => {
  const regions = page.locator(selector)
  const count = await regions.count()
  expect(count).toBeGreaterThan(0)
  let scrolling = 0
  for (let index = 0; index < count; index++) {
    const region = regions.nth(index)
    await expect(region).toHaveAttribute('tabindex', '0')
    expect(await region.getAttribute('aria-label')).toBeTruthy()
    scrolling += (await region.evaluate(node => node.scrollWidth > node.clientWidth)) ? 1 : 0
  }
  expect(scrolling).toBeGreaterThan(0)
  await regions.first().focus()
  await expect(regions.first()).toBeFocused()
}

test.describe('régions qui défilent à 390 px', () => {
  test('accueil : le bandeau des règles d’or défile, est nommé et focalisable (S6)', async ({ page }) => {
    await page.goto('/')
    await hydrated(page)
    await expectScrollRegion(page, '[data-cy="golden-rules"] ol.golden-rules__list')
  })

  test('joueur : le tableau du parcours défile, est nommé et focalisable', async ({ page }) => {
    await page.goto(PLAYER)
    await hydrated(page)
    await expectScrollRegion(page, '[data-cy="player-journey-table"]')
  })

  test('confidentialité : un tableau défile, est nommé et focalisable', async ({ page }) => {
    await page.goto('/confidentialite')
    await hydrated(page)
    await expectScrollRegion(page, '.legal-page__table[tabindex="0"]')
  })
})

test.describe('invitation : niveau de titre', () => {
  test('la carte d’état est un h2, juste sous le h1 de la page', async ({ page }) => {
    await page.goto('/invitation/jeton-de-test')
    await hydrated(page)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h2#invitation-state-title')).toBeVisible()
    await expect(page.locator('h3')).toHaveCount(0)
  })
})
