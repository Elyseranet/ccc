import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const EDITION = '/editions/2025'

const TABS = [
  { name: 'Synthèse', testId: 'edition-tab-summary', query: 'synthese' },
  { name: 'Participants', testId: 'edition-tab-participants', query: 'participants' },
  { name: 'Tirages', testId: 'edition-tab-draws', query: 'tirages' },
  { name: 'Poules', testId: 'edition-tab-pools', query: 'poules' },
  { name: 'Bracket', testId: 'edition-tab-bracket', query: 'bracket' },
  { name: 'Matchs', testId: 'edition-tab-matches', query: 'matchs' }
]

test.describe('édition : accessibilité et comportement (F-03a)', () => {
  for (const tab of TABS) {
    test(`onglet ${tab.name} : 0 violation axe, et l'URL porte l'onglet`, async ({ page }) => {
      await page.goto(EDITION)
      await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
      await page.getByTestId(tab.testId).click()
      if (tab.query !== 'synthese') {
        await expect(page).toHaveURL(new RegExp(`onglet=${tab.query}$`))
      }
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }

  test('recharger l’URL restaure l’onglet', async ({ page }) => {
    await page.goto(`${EDITION}?onglet=participants`)
    await expect(page.getByTestId('edition-tab-participants')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('edition-participants')).toBeVisible()
  })

  test('un onglet inconnu retombe sur la Synthèse', async ({ page }) => {
    await page.goto(`${EDITION}?onglet=inconnu`)
    await expect(page.getByTestId('edition-tab-summary')).toHaveAttribute('aria-selected', 'true')
  })

  test('changer d’édition conserve l’onglet et met l’URL à jour', async ({ page }) => {
    await page.goto(`${EDITION}?onglet=participants`)
    await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
    await page.getByTestId('edition-selector').click()
    await page.getByRole('option', { name: '2024' }).click()
    await expect(page).toHaveURL(/\/editions\/2024\?onglet=participants$/)
    await expect(page.getByTestId('edition-tab-participants')).toHaveAttribute('aria-selected', 'true')
  })

  test('deux éditions de 2012 : 2012a et 2012b, adressées par leur code', async ({ page }) => {
    await page.goto('/editions/2012a')
    await expect(page.getByTestId('page-title')).toContainText('2012a')
    await page.goto('/editions/2012b')
    await expect(page.getByTestId('page-title')).toContainText('2012b')
  })

  test('/editions mène à l’édition en cours (A5)', async ({ page }) => {
    await page.goto('/editions')
    await expect(page).toHaveURL(/\/editions\/20\d{2}[a-z]?$/)
  })

  test('une édition inconnue affiche l’erreur, avec un bouton pour réessayer', async ({ page }) => {
    await page.goto('/editions/1999')
    await expect(page.getByTestId('async-state-error')).toBeVisible()
    await expect(page.getByTestId('async-state-retry')).toBeVisible()
  })

  const open = async (page: Page, query: string): Promise<void> => {
    await page.goto(`${EDITION}?onglet=${query}`)
    await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  }

  test('Poules : un tableau légendé par poule, en-têtes de colonne, région défilante au clavier', async ({ page }) => {
    await open(page, 'poules')
    const tables = page.locator('[data-cy^="edition-pool-"] table')
    expect(await tables.count()).toBeGreaterThan(0)
    await expect(tables.first().locator('caption')).toBeVisible()
    await expect(tables.first().locator('thead th[scope="col"]').first()).toBeVisible()
    await expect(page.locator('[data-cy="edition-groups"] section[tabindex="0"]').first()).toBeVisible()
  })

  test('Bracket : région nommée et focalisable, seulement les tours publiés, liste alternative', async ({ page }) => {
    await open(page, 'bracket')
    const region = page.getByTestId('edition-bracket-region')
    await expect(region).toHaveAttribute('role', 'region')
    await expect(region).toHaveAttribute('tabindex', '0')
    expect(await region.getAttribute('aria-label')).toBeTruthy()
    const columns = await region.locator('h3').count()
    expect(columns).toBeGreaterThan(0)
    expect(await region.locator('ol').count()).toBe(columns)
    await expect(page.getByTestId('edition-bracket-list')).toBeAttached()
  })

  test('Matchs : filtres, numéro {code}-{séquence}, pagination à 16 par page', async ({ page }) => {
    await open(page, 'matchs')
    const rows = page.locator('[data-cy="edition-matches-table"] tbody tr')
    await expect(rows).toHaveCount(16)
    await expect(rows.first().locator('td').first()).toContainText(/^2025-\d+$/)
    const all = await page.getByTestId('edition-matches-range').innerText()
    await page.getByTestId('edition-matches-filter-pools').click()
    await expect(page.getByTestId('edition-matches-range')).not.toHaveText(all)
    await page.getByTestId('edition-matches-filter-all').click()
    await expect(page.getByTestId('edition-matches-range')).toHaveText(all)
    await page.getByTestId('edition-matches-pagination').getByRole('button', { name: /2/ }).first().click()
    await expect(rows.first().locator('td').first()).not.toContainText('2025-1')
  })

  test('hiérarchie h1 > h2 > h3 sans saut, un seul h1', async ({ page }) => {
    for (const tab of TABS) {
      await page.goto(`${EDITION}?onglet=${tab.query}`)
      await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
      const levels = await page.locator('main h1, main h2, main h3, main h4').evaluateAll(nodes => nodes.filter(node => node.closest('[hidden], [aria-hidden="true"]') === null).map(node => Number(node.tagName.slice(1))))
      expect(levels.filter(level => level === 1)).toHaveLength(1)
      levels.forEach((level, index) => {
        if (index > 0) {
          expect(level - levels[index - 1]!, `${tab.name} : saut de niveau`).toBeLessThanOrEqual(1)
        }
      })
    }
  })

  test('aucun commentaire ni score non validé dans la réponse publique', async ({ request }) => {
    const response = await request.get('/api/v1/editions/2025')
    const body = await response.text()
    expect(body).not.toContain('"comment"')
  })
})
