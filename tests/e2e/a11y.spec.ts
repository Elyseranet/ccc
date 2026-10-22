import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { markAwaitingRoutes } from './helpers/pending-routes'
import { signIn } from './helpers/session'
import { ADMIN_PAGES, PUBLIC_PAGES } from './pages.const'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test.describe('accessibilité des pages squelettes', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} : 0 violation axe`, async ({ page }) => {
      markAwaitingRoutes(path)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }

  for (const path of ADMIN_PAGES) {
    test(`${path} : 0 violation axe`, async ({ page, context }) => {
      markAwaitingRoutes(path)
      await signIn(context, 'admin')
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }
})

test.describe('repères de base', () => {
  test('lang="fr", un seul h1, repères header / nav nommé / main / footer', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('header')).toHaveCount(1)
    await expect(page.locator('main#contenu')).toHaveCount(1)
    await expect(page.locator('footer')).toHaveCount(1)
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Pied de page' })).toBeVisible()
  })

  test('le lien d’évitement est le premier élément focalisable et mène à main', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByTestId('skip-link')
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#contenu$/)
    await expect(page.locator('main#contenu')).toBeFocused()
  })

  test('un titre de page unique par route', async ({ page }) => {
    const titles = new Set<string>()
    for (const path of PUBLIC_PAGES) {
      await page.goto(path)
      titles.add(await page.title())
    }
    expect(titles.size).toBeGreaterThanOrEqual(8)
  })
})
