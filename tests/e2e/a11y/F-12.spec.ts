import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { FIXTURE_SESSION_COOKIE } from '../pages.const'

const COOKIE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const ROUTE = '/admin/plus'
const OTHER_ADMIN_ROUTE = '/admin/matchs'

test.describe('F-12 admin Plus', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ context }) => {
    await context.addCookies([{ name: FIXTURE_SESSION_COOKIE, value: 'admin', url: COOKIE_URL }])
  })

  test('0 violation axe sur le rendu hydraté', async ({ page }) => {
    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([])
  })

  test('un seul h1, navigation nommée, trois entrées vers les bonnes routes', async ({ page }) => {
    await page.goto(ROUTE)
    await expect(page.locator('h1')).toHaveCount(1)
    const nav = page.getByRole('navigation', { name: 'Plus d’options' })
    // Origam#1249 : origam-list-item pose role="listitem" sur l'<a>, qui perd son rôle link. On cible donc listitem ; à repasser sur link à la correction.
    const items = nav.getByRole('listitem')
    await expect(items).toHaveCount(3)
    await expect(items.filter({ hasText: 'Participants' })).toHaveAttribute('href', '/admin/participants')
    await expect(items.filter({ hasText: 'Voir le site public' })).toHaveAttribute('href', '/')
    await expect(items.filter({ hasText: 'Mon compte' })).toHaveAttribute('href', '/profil')
  })

  test('la page est utilisable au clavier : liens, sélecteur et bouton sont atteignables', async ({ page }) => {
    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')
    const targets = [page.getByTestId('admin-more-edition-select').locator('input'), page.getByTestId('admin-more-logout')]
    for (const target of targets) {
      await target.focus()
      await expect(target).toBeFocused()
    }
  })

  test('le libellé est relié au champ par label for, la section par aria-labelledby au titre', async ({ page }) => {
    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')
    const label = page.locator('label', { hasText: 'Toutes les pages travaillent sur cette édition' })
    await expect(label).toHaveCount(1)
    const target = await label.getAttribute('for')
    expect(target).toBeTruthy()
    await expect(page.locator(`input[id="${target}"]`)).toHaveCount(1)
    await expect(page.getByRole('region', { name: 'Édition active' })).toHaveCount(1)
  })

  // Origam : sans prop `label`, l'input du select est nommé « Ouvrir » (aria-label et title), ce qui écrase tout <label for>.
  // Défaut suivi dans Elyseranet/origam#1251 (fiche : docs/tickets/origam/select-aria-label-ecrase-label.md).
  test('les deux sélecteurs d’édition ont un nom accessible explicite, jamais « Ouvrir »', async ({ page }) => {
    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('combobox', { name: 'Toutes les pages travaillent sur cette édition' })).toHaveCount(1)
    await expect(page.getByRole('banner').getByRole('combobox', { name: 'Édition active' })).toHaveCount(1)
    await expect(page.getByRole('combobox', { name: 'Ouvrir' })).toHaveCount(0)
  })

  test('le bouton Se déconnecter est pleine largeur et ne grandit pas', async ({ page }) => {
    await page.goto(ROUTE)
    const button = page.getByTestId('admin-more-logout')
    const container = page.locator('.admin-more')
    const buttonBox = await button.boundingBox()
    const containerBox = await container.boundingBox()
    expect(buttonBox!.width).toBeCloseTo(containerBox!.width, 0)
    expect(buttonBox!.height).toBeLessThanOrEqual(48)
  })

  test('changer d’édition ici change l’édition active des autres pages admin', async ({ page }) => {
    await page.goto(OTHER_ADMIN_ROUTE)
    await page.waitForLoadState('networkidle')
    const layoutSelect = page.getByTestId('admin-edition-select')
    const before = await layoutSelect.locator('.origam-select__selection-text').innerText()

    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')
    await page.getByTestId('admin-more-edition-select').click()
    const options = page.getByRole('option')
    const target = options.filter({ hasNotText: before }).first()
    const chosen = (await target.innerText()).trim()
    await target.click()
    await expect(page.getByTestId('admin-more-edition-select').locator('.origam-select__selection-text')).toHaveText(chosen)

    await page.getByRole('navigation', { name: 'Administration (mobile)' }).getByRole('link', { name: 'Matchs' }).click()
    await expect(page).toHaveURL(new RegExp(`${OTHER_ADMIN_ROUTE}$`))
    await expect(page.getByTestId('admin-edition-select').locator('.origam-select__selection-text')).toHaveText(chosen)
    expect(chosen).not.toBe(before)
  })

  // La variante de fixture s'applique à tous les services, `GET /moi` compris : la session de fixture devient vide ou en erreur,
  // donc l'accès admin est refusé et le middleware renvoie vers /connexion. On vérifie ce repli propre (pas de plantage ni d'erreur
  // console) ; l'état dégradé du sélecteur seul est couvert en test unitaire (tests/nuxt/front/admin-more.test.ts).
  for (const variant of ['error', 'empty', 'rate_limited']) {
    test(`variante ${variant} : repli propre vers /connexion, sans plantage ni erreur console`, async ({ page }) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text())
        }
      })
      page.on('pageerror', error => pageErrors.push(error.message))
      const response = await page.goto(`${ROUTE}?fixture=${variant}`)
      await page.waitForLoadState('networkidle')
      expect(response!.status()).toBeLessThan(500)
      await expect(page).toHaveURL(/\/connexion/)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(pageErrors).toEqual([])
      expect(consoleErrors).toEqual([])
    })
  }

  test('se déconnecter renvoie vers l’espace public et vide la session', async ({ page }) => {
    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')
    await page.getByTestId('admin-more-logout').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('admin-avatar')).toHaveCount(0)
    await page.goBack()
    await expect(page).toHaveURL(/\/connexion/)
  })
})
