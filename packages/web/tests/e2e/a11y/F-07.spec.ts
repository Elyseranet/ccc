import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { ROUTES } from '../../../src/consts/routes.const'
import { E2E_BASE_URL, E2E_SESSION_COOKIE } from '../helpers/e2e.const'
import { markAwaitingRoutes } from '../helpers/pending-routes'
import { signIn } from '../helpers/session'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const ROUTE = '/admin'
const STEP_COUNT = 9

for (const viewport of [{ name: '390', width: 390, height: 844 }, { name: '1440', width: 1440, height: 900 }]) {
  test.describe(`F-07 admin tableau de bord @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test.beforeEach(async ({ context }) => {
      markAwaitingRoutes(ROUTE)
      await signIn(context, 'admin')
    })

    test('0 violation axe sur le rendu hydraté', async ({ page }) => {
      await page.goto(ROUTE)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([])
    })

    test('un seul h1, trois régions nommées par leur titre, neuf étapes dont une seule courante', async ({ page }) => {
      await page.goto(ROUTE)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.getByRole('region', { name: 'Centre de contrôle' })).toHaveCount(1)
      await expect(page.getByRole('region', { name: 'À traiter maintenant' })).toHaveCount(1)
      await expect(page.getByRole('region', { name: 'Activité récente' })).toHaveCount(1)
      await expect(page.locator('[data-cy^="stepper-item-"]')).toHaveCount(STEP_COUNT)
      await expect(page.locator('[data-cy^="stepper-item-"][aria-current="step"]')).toHaveCount(1)
    })

    test('le statut de chaque étape est dit en texte, pas par la couleur seule', async ({ page }) => {
      await page.goto(ROUTE)
      await page.waitForLoadState('networkidle')
      const items = page.locator('[data-cy^="stepper-item-"]')
      for (let index = 0; index < STEP_COUNT; index += 1) {
        await expect(items.nth(index)).toContainText(/Fait|En cours|À venir/)
      }
    })

    test('les cartes « À traiter » cliquables et le bouton de validation sont atteignables au clavier', async ({ page }) => {
      await page.goto(ROUTE)
      await page.waitForLoadState('networkidle')
      const targets = [page.getByTestId('admin-dashboard-cta'), page.getByTestId('admin-todo-recorded'), page.getByTestId('admin-todo-scheduled')]
      for (const target of targets) {
        await target.focus()
        await expect(target).toBeFocused()
      }
    })

    test('la carte « saisis » et le bouton mènent à la file « Saisis » de /admin/matchs', async ({ page }) => {
      await page.goto(ROUTE)
      await page.waitForLoadState('networkidle')
      await expect(page.getByTestId('admin-todo-recorded')).toHaveAttribute('href', /\/admin\/matchs\?f=saisis$/)
      await expect(page.getByTestId('admin-dashboard-cta')).toHaveAttribute('href', /\/admin\/matchs\?f=saisis$/)
    })

    test('route d’activité en erreur (500) : le bloc est en erreur annoncée et le reste de la page reste complet', async ({ page }) => {
      await page.goto(ROUTES.ADMIN_MORE)
      await page.waitForLoadState('networkidle')
      await page.route('**/api/v1/admin/editions/*/activite*', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
      await page.evaluate(() => (window as unknown as { useNuxtApp: () => { $router: { push: (path: string) => Promise<unknown> } } }).useNuxtApp().$router.push('/admin'))
      await expect(page.locator('[data-cy="admin-activity"] [data-cy="async-state-error"]')).toBeVisible()
      await expect(page.getByTestId('admin-control-center')).toBeVisible()
      await expect(page.getByTestId('admin-todo')).toBeVisible()
    })
  })
}

test.describe('F-07 admin tableau de bord, accès', () => {
  test('session inconnue : repli propre vers /connexion, sans plantage ni erreur console', async ({ page, context }) => {
    await context.clearCookies()
    await context.addCookies([{ name: E2E_SESSION_COOKIE, value: 'x'.repeat(43), url: E2E_BASE_URL, httpOnly: true, sameSite: 'Lax' }])
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    const response = await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')
    expect(response!.status()).toBeLessThan(500)
    await expect(page).toHaveURL(/\/connexion/)
    expect(consoleErrors).toEqual([])
  })

  test('participant : accès refusé, redirigé vers /connexion', async ({ page, context }) => {
    await signIn(context, 'participant')
    await page.goto(ROUTE)
    await expect(page).toHaveURL(/\/connexion/)
  })
})
