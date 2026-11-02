import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const CHART_NESTED_INTERACTIVE = 'nested-interactive'
const TABS = [
  { name: 'ACP', testId: 'palmares-tab-acp', query: 'acp' },
  { name: 'All Time', testId: 'palmares-tab-all-time', query: 'all-time' },
  { name: 'Évolution', testId: 'palmares-tab-evolution', query: 'evolution' }
]

interface IEditionTitle { code: string, status: string, champion: { competitor: { displayName: string }, titlesToDate: number } | null, final: { runnerUp: { displayName: string }, runnerUpTitlesToDate: number, score: { champion: number, runnerUp: number } | null } | null }
interface IRankingRow { rank: number, competitor: { displayName: string }, points: number, titles: number }

const open = async (page: Page, query = ''): Promise<void> => {
  await page.goto(`/palmares${query}`)
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

test.describe('palmarès : accessibilité et comportement (F-02)', () => {
  for (const tab of TABS) {
    test(`onglet ${tab.name} : 0 violation axe, et l'URL porte l'onglet`, async ({ page }) => {
      await open(page)
      await page.getByTestId(tab.testId).click()
      if (tab.query !== 'acp') {
        await expect(page).toHaveURL(new RegExp(`onglet=${tab.query}$`))
      }
      // Origam : les points d'une courbe (`role="button"`, `tabindex="0"`) sont dans un `<svg role="img">` (OrigamChartCartesian.vue:87, 205-208) :
      // `nested-interactive`, sans réglage possible. Le tableau équivalent porte toutes les valeurs. Fiche docs/tickets/origam/chart-points-focusables-dans-svg-img.md.
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).disableRules(tab.query === 'evolution' ? [CHART_NESTED_INTERACTIVE] : []).analyze()
      expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }

  test('?onglet=evolution ouvre le bon onglet, un onglet inconnu retombe sur ACP', async ({ page }) => {
    await open(page, '?onglet=evolution')
    await expect(page.getByTestId('palmares-tab-evolution')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('palmares-evolution')).toBeVisible()
    await open(page, '?onglet=inconnu')
    await expect(page.getByTestId('palmares-tab-acp')).toHaveAttribute('aria-selected', 'true')
  })

  test('clavier : les flèches parcourent les onglets', async ({ page }) => {
    await open(page)
    await page.getByTestId('palmares-tab-acp').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('palmares-tab-all-time')).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('palmares-tab-evolution')).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('palmares-tab-all-time')).toHaveAttribute('aria-selected', 'true')
  })

  test('classements : légende, en-têtes de colonne, aria-sort sur les colonnes triables, rang de l’API', async ({ page, request }) => {
    const acp = await (await request.get('/api/v1/classements/acp')).json() as IRankingRow[]
    await open(page)
    const table = page.getByTestId('palmares-table-acp').locator('table')
    await expect(table.locator('caption')).toBeVisible()
    await expect(table.locator('thead th[scope="col"]')).toHaveCount(6)
    await expect(table.locator('thead th[aria-sort]').first()).toHaveAttribute('aria-sort', 'ascending')
    expect(await table.locator('thead th[aria-sort]').count()).toBeGreaterThanOrEqual(2)
    await expect(table.locator('tbody tr').first().locator('td').first()).toHaveText(String(acp[0]?.rank))
    const ranks = await table.locator('tbody tr td:first-child').allTextContents()
    expect(ranks.map(Number)).toEqual(acp.map(entry => entry.rank))
  })

  test('classement ACP : les ex aequo partagent le rang (données réelles)', async ({ request }) => {
    const acp = await (await request.get('/api/v1/classements/acp')).json() as IRankingRow[]
    const byPoints = new Map<number, number[]>()
    for (const entry of acp) {
      byPoints.set(entry.points, [...(byPoints.get(entry.points) ?? []), entry.rank])
    }
    const ties = [...byPoints.values()].filter(ranks => ranks.length > 1)
    expect(ties.length).toBeGreaterThan(0)
    for (const ranks of ties) {
      expect(new Set(ranks).size).toBe(1)
    }
  })

  test('chronologie : un titre par édition, la plus récente d’abord, étoiles et score de l’API', async ({ page, request }) => {
    const all = await (await request.get('/api/v1/editions')).json() as IEditionTitle[]
    const editions = all.filter(entry => entry.champion !== null)
    await open(page)
    await expect(page.locator('.palmares-titles__item')).toHaveCount(all.length)
    const champion = editions[0] as IEditionTitle
    const card = page.getByTestId(`palmares-title-${champion.code}`)
    await expect(card.locator('.palmares-titles__who .player-link__name')).toHaveText(champion.champion?.competitor.displayName as string)
    const titles = champion.champion?.titlesToDate ?? 0
    if (titles > 0) {
      await expect(card.locator('.palmares-titles__who .player-link__stars')).toHaveText('*'.repeat(titles))
    }
    if (champion.final?.score) {
      await expect(card.locator('.palmares-titles__final b')).toHaveText(`${champion.final.score.champion}–${champion.final.score.runnerUp}`)
    }
  })

  test('édition courante sans champion : « Édition en cours » et un lien vers l’édition, aucun champion inventé', async ({ page, request }) => {
    const editions = await (await request.get('/api/v1/editions')).json() as IEditionTitle[]
    const current = editions.find(entry => entry.champion === null)
    expect(current, 'la base de test porte l’édition 2026 en phase de poules (T-QA-03)').toBeTruthy()
    await open(page)
    const card = page.getByTestId(`palmares-title-${current?.code}`)
    await expect(card).toContainText('Édition en cours')
    await expect(card.locator('.player-link')).toHaveCount(0)
    await expect(card.getByRole('link')).toHaveAttribute('href', `/editions/${current?.code}`)
  })

  test('évolution : le graphique est doublé d’un tableau équivalent, sous « Voir en tableau »', async ({ page }) => {
    await open(page, '?onglet=evolution')
    await expect(page.getByTestId('palmares-evolution-chart')).toBeVisible()
    const details = page.getByTestId('palmares-evolution-table')
    await expect(details.locator('table')).toBeHidden()
    const toggle = page.getByTestId('palmares-evolution-toggle')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const table = details.locator('table')
    await expect(table).toBeVisible()
    await expect(table.locator('caption')).toHaveCount(1)
    expect(await table.locator('tbody tr').count()).toBeGreaterThan(0)
    expect(await table.locator('thead th[scope="col"]').count()).toBeGreaterThan(2)
  })

  test('le plus titré : le plus de titres du classement All Time', async ({ page, request }) => {
    const allTime = await (await request.get('/api/v1/classements/all-time')).json() as IRankingRow[]
    const most = allTime.reduce((best, entry) => (entry.titles > best.titles ? entry : best), allTime[0] as IRankingRow)
    await open(page)
    await expect(page.getByTestId('palmares-most-titled-name')).toHaveText(most.competitor.displayName)
  })
})
