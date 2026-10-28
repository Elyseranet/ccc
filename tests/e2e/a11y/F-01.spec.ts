import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const hydrated = async (page: Page, url = '/') => {
  await page.goto(url)
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
}

/** Navigation côté client (le rendu serveur ne peut pas être intercepté) : on part d'une autre page, puis on pousse l'accueil. */
const pushHome = async (page: Page) => {
  await page.evaluate(() => (window as unknown as { useNuxtApp: () => { $router: { push: (to: string) => Promise<void> } } }).useNuxtApp().$router.push('/'))
}

const violations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
}

test.describe('accueil : a11y sur le rendu hydraté, données réelles', () => {
  test('/ : 0 violation axe', async ({ page }) => {
    await hydrated(page)
    expect(await violations(page)).toEqual([])
  })

  test('erreur serveur (réponse interceptée) : 0 violation axe, alerte avec Réessayer, le hero reste affiché', async ({ page }) => {
    await hydrated(page, '/regles')
    await page.route('**/api/v1/editions', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'x' }) }))
    await pushHome(page)
    await expect(page.getByTestId('async-state-error')).toBeVisible()
    await expect(page.getByTestId('async-state-retry')).toBeVisible()
    await expect(page.getByTestId('home-hero')).toBeVisible()
    expect(await violations(page)).toEqual([])
  })

  test('429 (réponse interceptée) : message dédié', async ({ page }) => {
    await hydrated(page, '/regles')
    await page.route('**/api/v1/editions', route => route.fulfill({ status: 429, headers: { 'retry-after': '30' }, contentType: 'application/json', body: JSON.stringify({ statusCode: 429, code: 'RATE_LIMITED', message: 'x' }) }))
    await pushHome(page)
    await expect(page.getByTestId('async-state-error')).toContainText('Trop de requêtes')
  })
})

test.describe('accueil : comportements sur les vraies données', () => {
  test('A16 : la tuile « matchs » affiche les valeurs de GET /stats, jamais des constantes', async ({ page, request }) => {
    const stats = await (await request.get('/api/v1/stats')).json() as { matches: number, scoredMatches: number }
    await hydrated(page)
    const tile = page.getByTestId('home-tile-matches')
    await expect(tile).toContainText(String(stats.matches))
    await expect(tile).toContainText(`dont ${stats.scoredMatches} avec score`)
    await expect(tile.locator('.sr-only')).toHaveText(new RegExp(`^${stats.matches} matchs joués depuis \\d{4}, dont ${stats.scoredMatches} avec score$`))
  })

  test('le bandeau des règles d’or ne défile jamais automatiquement', async ({ page }) => {
    await hydrated(page)
    const list = page.getByTestId('golden-rules').locator('ol')
    const before = await list.evaluate(node => node.scrollLeft)
    await page.waitForTimeout(1500)
    expect(await list.evaluate(node => node.scrollLeft)).toBe(before)
    expect(await list.evaluate(node => getComputedStyle(node).animationName)).toBe('none')
  })

  test('une carte cliquable est opaque au repos (overlay à 0) et s’assombrit de 12 % au survol (F-00t)', async ({ page }) => {
    await hydrated(page)
    const tile = page.getByTestId('home-tile-editions')
    const opacity = () => tile.locator('.origam-card__overlay').evaluate(node => getComputedStyle(node).opacity)
    expect(await opacity()).toBe('0')
    await tile.hover()
    expect(await opacity()).toBe('0.12')
  })

  test('sous prefers-reduced-motion, le canvas ne dessine rien et le contenu reste complet', async ({ page }) => {
    await hydrated(page)
    await page.waitForTimeout(800)
    const painted = await page.getByTestId('bubbles-backdrop').evaluate((node) => {
      const canvas = node as HTMLCanvasElement
      const context = canvas.getContext('2d')
      if (!context || canvas.width === 0 || canvas.height === 0) {
        return false
      }
      return context.getImageData(0, 0, canvas.width, canvas.height).data.some(value => value !== 0)
    })
    expect(painted).toBe(false)
    await expect(page.getByTestId('page-title')).toBeVisible()
    await expect(page.getByTestId('home-cta-primary')).toBeVisible()
  })

  test('la pastille « N éditions » est pleine, ambre, au texte « encre de nuit » (recette chips)', async ({ page }) => {
    await hydrated(page)
    const chip = page.getByTestId('home-hero-chip')
    const colors = await chip.evaluate((node) => {
      const style = getComputedStyle(node)
      return { color: style.color, background: style.backgroundColor }
    })
    expect(colors.color).toBe('rgb(22, 11, 46)')
    expect(colors.background).toBe('rgb(255, 178, 26)')
  })

  test('les liens de l’accueil : CTA vers l’édition, classement, face-à-face', async ({ page }) => {
    await hydrated(page)
    await expect(page.getByTestId('home-cta-primary')).toHaveAttribute('href', /^\/editions\/.+/)
    await expect(page.getByTestId('home-cta-secondary')).toHaveAttribute('href', '/palmares')
    await expect(page.getByTestId('home-tile-head-to-head')).toHaveAttribute('href', '/joueurs/face-a-face')
  })
})
