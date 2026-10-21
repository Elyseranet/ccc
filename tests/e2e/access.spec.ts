import { expect, test } from '@playwright/test'
import { FIXTURE_SESSION_COOKIE } from './pages.const'

const COOKIE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`

test.describe('accès à /admin', () => {
  test('sans session, renvoie vers /connexion', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/connexion$/)
  })

  test('avec la fixture participant, renvoie vers /connexion', async ({ page, context }) => {
    await context.addCookies([{ name: FIXTURE_SESSION_COOKIE, value: 'participant', url: COOKIE_URL }])
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/connexion$/)
  })

  test('avec la fixture administrateur, la page s’affiche', async ({ page, context }) => {
    await context.addCookies([{ name: FIXTURE_SESSION_COOKIE, value: 'admin', url: COOKIE_URL }])
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByTestId('page-title')).toBeVisible()
  })

  test('en-tête public : « Espace organisateur » pour l’administrateur, rien sans session', async ({ page, context }) => {
    await page.goto('/')
    await expect(page.locator('[data-cy="account-link"]')).toHaveCount(0)
    await context.addCookies([{ name: FIXTURE_SESSION_COOKIE, value: 'admin', url: COOKIE_URL }])
    await page.goto('/')
    await expect(page.locator('[data-cy="account-link"]')).toHaveText('Espace organisateur')
  })
})
