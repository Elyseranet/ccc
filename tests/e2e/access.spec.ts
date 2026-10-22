import { expect, test } from '@playwright/test'
import { signIn } from './helpers/session'

test.describe('accès à /admin', () => {
  test('sans session, renvoie vers /connexion', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/connexion$/)
  })

  test('avec une session participant, renvoie vers /connexion', async ({ page, context }) => {
    await signIn(context, 'participant')
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/connexion$/)
  })

  test('avec une session administrateur, la page s’affiche', async ({ page, context }) => {
    await signIn(context, 'admin')
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByTestId('page-title')).toBeVisible()
  })

  test('en-tête public : « Espace organisateur » pour l’administrateur, rien sans session', async ({ page, context }) => {
    await page.goto('/')
    await expect(page.locator('[data-cy="account-link"]')).toHaveCount(0)
    await signIn(context, 'admin')
    await page.goto('/')
    await expect(page.locator('[data-cy="account-link"]')).toHaveText('Espace organisateur')
  })
})
