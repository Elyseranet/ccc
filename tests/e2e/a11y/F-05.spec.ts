import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { BASE, pairUrl, resolvePair, UNKNOWN_ID } from '../helpers/head-to-head'
import type { IPairIds } from '../helpers/head-to-head'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

let ids: IPairIds
test.beforeAll(async ({ request }) => {
  ids = await resolvePair(request)
})

const hydrated = async (page: Page, url: string) => {
  await page.goto(url)
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
}

const violations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
}

/** Navigation côté client (le rendu serveur ne peut pas être intercepté) : on part de l'écran vide, puis on pousse la paire. */
const pushPair = async (page: Page, a: string, b: string) => {
  await page.evaluate(([first, second]) => (window as unknown as { useNuxtApp: () => { $router: { push: (to: unknown) => Promise<void> } } })
    .useNuxtApp().$router.push({ query: { a: first, b: second } }), [a, b])
}

test.describe('face-à-face : a11y sur le rendu hydraté, données réelles', () => {
  const cases: Array<{ name: string, url: () => string }> = [
    { name: 'paire avec rencontres', url: () => pairUrl(ids.a, ids.b) },
    { name: 'jamais affrontés (winRatio null)', url: () => pairUrl(ids.a, ids.neverMet) },
    { name: 'aucun joueur choisi', url: () => BASE },
    { name: 'même joueur deux fois', url: () => pairUrl(ids.a, ids.a) },
    { name: 'identifiant invalide', url: () => pairUrl(ids.a, 'nimportequoi') },
    { name: 'identifiant inconnu', url: () => pairUrl(ids.a, UNKNOWN_ID) }
  ]
  for (const entry of cases) {
    test(`${entry.name} : 0 violation axe`, async ({ page }) => {
      await hydrated(page, entry.url())
      expect(await violations(page)).toEqual([])
    })
  }

  test('erreur serveur (réponse interceptée) : 0 violation axe, alerte avec Réessayer', async ({ page }) => {
    await hydrated(page, BASE)
    await page.route('**/api/v1/competiteurs/*/face-a-face*', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'x' }) }))
    await pushPair(page, ids.a, ids.b)
    await expect(page.getByTestId('async-state-error')).toBeVisible()
    await expect(page.getByTestId('async-state-retry')).toBeVisible()
    expect(await violations(page)).toEqual([])
  })

  test('429 (réponse interceptée) : message dédié et Réessayer', async ({ page }) => {
    await hydrated(page, BASE)
    await page.route('**/api/v1/competiteurs/*/face-a-face*', route => route.fulfill({ status: 429, headers: { 'retry-after': '30' }, contentType: 'application/json', body: JSON.stringify({ statusCode: 429, code: 'RATE_LIMITED', message: 'x' }) }))
    await pushPair(page, ids.a, ids.b)
    await expect(page.getByTestId('async-state-error')).toContainText('Trop de requêtes')
    await expect(page.getByTestId('async-state-retry')).toBeVisible()
  })
})

test.describe('face-à-face : comportement sur les vraies données', () => {
  test('une paire avec rencontres : score, barre, bilans et tableau', async ({ page }) => {
    await hydrated(page, pairUrl(ids.a, ids.b))
    await expect(page.getByTestId('head-to-head-score')).toContainText('2')
    await expect(page.getByTestId('head-to-head-bar')).toHaveAttribute('aria-valuenow', '50')
    await expect(page.getByTestId('head-to-head-table').locator('tbody tr')).toHaveCount(4)
    await expect(page.getByTestId('head-to-head-stats-a')).toContainText('%')
  })

  test('même joueur : erreur sur les deux champs reliée par aria-describedby, sans appel de paire', async ({ page }) => {
    const pairCalls: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/') && request.url().includes('adversaire')) {
        pairCalls.push(request.url())
      }
    })
    await hydrated(page, pairUrl(ids.a, ids.a))
    for (const side of ['a', 'b']) {
      const input = page.locator(`[data-cy="head-to-head-player-${side}"] input`)
      const describedBy = await input.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      await expect(page.locator(`[id="${describedBy}"]`)).toContainText('Choisissez deux joueurs différents.')
    }
    await expect(page.getByTestId('head-to-head-score')).toHaveCount(0)
    expect(pairCalls).toEqual([])
  })

  test('Inverser met l’URL à jour et se joue au clavier', async ({ page }) => {
    await hydrated(page, pairUrl(ids.a, ids.b))
    await page.getByTestId('head-to-head-swap').focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`a=${ids.b}&b=${ids.a}`))
    await expect(page.getByTestId('head-to-head-wins-a')).toBeVisible()
  })

  test('jamais affrontés : état vide, aucun « 0 % »', async ({ page }) => {
    await hydrated(page, pairUrl(ids.a, ids.neverMet))
    await expect(page.getByTestId('head-to-head-never-met')).toBeVisible()
    await expect(page.getByTestId('head-to-head-bar')).toHaveCount(0)
    await expect(page.getByTestId('head-to-head-history')).not.toContainText('0 %')
  })

  test('identifiant inconnu dans l’URL : message sur le champ concerné', async ({ page }) => {
    await hydrated(page, pairUrl(ids.a, UNKNOWN_ID))
    const input = page.locator('[data-cy="head-to-head-player-b"] input')
    const describedBy = await input.getAttribute('aria-describedby')
    await expect(page.locator(`[id="${describedBy}"]`)).toContainText('Aucun joueur ne correspond à cet identifiant.')
  })

  test('autocomplétion : taper, choisir, l’URL suit', async ({ page }) => {
    await hydrated(page, `${BASE}?a=${ids.a}`)
    const input = page.locator('[data-cy="head-to-head-player-b"] input')
    await input.click()
    await input.fill('Nicolas Des')
    const option = page.getByRole('option', { name: /Nicolas Deseine/ })
    await expect(option.first()).toBeVisible()
    await option.first().click()
    await expect(page).toHaveURL(new RegExp(`b=${ids.b}`))
  })

  test('chaque champ a un nom accessible (label externe + prop label), jamais « Ouvrir »', async ({ page }) => {
    await hydrated(page, pairUrl(ids.a, ids.b))
    await expect(page.getByRole('combobox', { name: 'Joueur 1' }).first()).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Joueur 2' }).first()).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Ouvrir' })).toHaveCount(0)
    await expect(page.locator('label', { hasText: 'Joueur 1' }).first()).toBeVisible()
  })

  test('le tableau défilant est une région nommée, focalisable au clavier', async ({ page }) => {
    await hydrated(page, pairUrl(ids.a, ids.b))
    const region = page.getByRole('region', { name: 'Historique des rencontres' })
    await expect(region).toBeVisible()
    await expect(region).toHaveAttribute('tabindex', '0')
  })
})
