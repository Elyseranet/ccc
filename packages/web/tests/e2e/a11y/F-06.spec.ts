import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const TABS = [
  { name: 'Le jeu', testId: 'rules-tab-game' },
  { name: 'Le tournoi', testId: 'rules-tab-tournament' },
  { name: 'Variantes', testId: 'rules-tab-variants' }
]

test.describe('règles : accessibilité', () => {
  for (const tab of TABS) {
    test(`onglet ${tab.name} : 0 violation axe`, async ({ page }) => {
      await page.goto('/regles')
      await page.waitForLoadState('networkidle')
      await page.getByTestId(tab.testId).click()
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }

  test('hiérarchie h1 > h2 > h3 sans saut, un seul h1', async ({ page }) => {
    await page.goto('/regles')
    await page.waitForLoadState('networkidle')
    for (const tab of TABS) {
      await page.getByTestId(tab.testId).click()
      const levels = await page.locator('main h1, main h2, main h3, main h4').evaluateAll(nodes => nodes.filter(node => (node as HTMLElement).offsetParent !== null || getComputedStyle(node).position === 'absolute').filter(node => node.closest('[hidden], [aria-hidden="true"]') === null).map(node => Number(node.tagName.slice(1))))
      expect(levels.filter(level => level === 1)).toHaveLength(1)
      levels.forEach((level, index) => {
        if (index > 0) {
          expect(level - levels[index - 1]!, `${tab.name} : saut de niveau`).toBeLessThanOrEqual(1)
        }
      })
    }
  })

  test('/regles#variantes ouvre l’onglet Variantes et y amène le focus', async ({ page }) => {
    await page.goto('/regles#variantes')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('rules-tab-variants')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#variantes')).toBeVisible()
    await expect(page.locator('#variantes')).toBeFocused()
  })

  test('/variants redirige vers l’onglet Variantes', async ({ page }) => {
    await page.goto('/variants')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/regles#variantes$/)
    await expect(page.getByTestId('rules-tab-variants')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#variantes')).toBeFocused()
  })

  test('navigation clavier entre onglets (flèches)', async ({ page }) => {
    await page.goto('/regles')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('rules-tab-game').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('rules-tab-tournament')).toHaveAttribute('aria-selected', 'true')
  })
})
