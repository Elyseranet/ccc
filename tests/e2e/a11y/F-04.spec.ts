import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000'

/** Ids figés par le dump des archives (ARCH-9) : Benoit Bastien a 5 adversaires, Céline Toni en a exactement 4. */
const PLAYER_WITH_FIVE_OPPONENTS = '1a51badd-d10a-4ad2-af69-3db5d49459dc'

const PLAYER_WITH_FOUR_OPPONENTS = '4ea7c348-33a3-45ab-a4fa-ca924c92f522'

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
}

const mostTitledPlayerId = async (page: Page): Promise<string> => {
  const response = await page.request.get('/api/v1/competiteurs?sort=titles&order=desc&pageSize=1')
  const body = await response.json() as { items: Array<{ id: string }> }
  return body.items[0]!.id
}

test.describe('joueurs : accessibilité et recherche', () => {
  test('/joueurs : 0 violation axe, un seul h1, recherche nommée, compteur annoncé', async ({ page }) => {
    await page.goto('/joueurs')
    await page.waitForLoadState('networkidle')
    expect(await violationsOf(page)).toEqual([])
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('search')).toBeVisible()
    await expect(page.getByLabel('Nom ou pseudo')).toBeVisible()
    await expect(page.getByTestId('players-count')).toHaveAttribute('role', 'status')
    await expect(page.getByTestId('players-count')).toContainText('146 joueurs')
    await expect(page.locator('[data-cy="players-table"] tbody tr')).toHaveCount(20)
  })

  test('une recherche valide au clavier met l’état dans l’URL, insensible aux accents et à la casse', async ({ page }) => {
    await page.goto('/joueurs')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Nom ou pseudo').fill('andrea')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/q=andrea/)
    await expect(page.getByTestId('players-count')).toContainText('joueur')
    const names = await page.locator('[data-cy="players-table"] .player-link__name').allTextContents()
    expect(names.length).toBeGreaterThan(0)
    expect(names.some(name => name.includes('Andréa'))).toBe(true)
    const withAccent = await page.request.get('/api/v1/competiteurs?q=ANDR%C3%89A')
    const without = await page.request.get('/api/v1/competiteurs?q=andrea')
    expect((await withAccent.json()).items.map((item: { id: string }) => item.id)).toEqual((await without.json()).items.map((item: { id: string }) => item.id))
    expect(await violationsOf(page)).toEqual([])
  })

  test('un résultat vide est annoncé et accessible', async ({ page }) => {
    await page.goto('/joueurs?q=zzzzzz')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('players-count')).toHaveText('Aucun joueur trouvé')
    await expect(page.getByTestId('async-state-empty')).toBeVisible()
    expect(await violationsOf(page)).toEqual([])
  })

  test('la pagination et le tri vivent dans l’URL', async ({ page }) => {
    await page.goto('/joueurs')
    await page.waitForLoadState('networkidle')
    const pagination = page.getByTestId('players-pagination')
    await pagination.getByRole('button', { name: /page 2$/i }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByTestId('players-pager-range')).toHaveText('21–40 sur 146')
    await expect(pagination.getByRole('button', { name: /page 2$/i })).toHaveAttribute('aria-current', 'page')
    await page.goto('/joueurs')
    await page.waitForLoadState('networkidle')
    await page.getByRole('columnheader', { name: /Victoires/ }).click()
    await expect(page).toHaveURL(/tri=wins/)
  })

  test('la pagination se parcourt au clavier (un bouton de page prend le focus, Entrée change de page)', async ({ page }) => {
    await page.goto('/joueurs')
    await page.waitForLoadState('networkidle')
    const pagination = page.getByTestId('players-pagination')
    const third = pagination.getByRole('button', { name: /page 3$/i })
    await third.focus()
    await expect(third).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/page=3/)
    await expect(page.getByTestId('players-pager-range')).toHaveText('41–60 sur 146')
    await expect(pagination.getByRole('button', { name: /page 3$/i })).toHaveAttribute('aria-current', 'page')
  })

  test('le filtre d’édition ne filtre que les inscrits et précise que les statistiques sont celles de la carrière', async ({ page }) => {
    await page.goto('/joueurs')
    await page.waitForLoadState('networkidle')
    const editions = await (await page.request.get('/api/v1/editions')).json() as Array<{ id: string }>
    await page.goto(`/joueurs?edition=${editions[0]!.id}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('players-career-note')).toContainText('toute la carrière')
    expect(await violationsOf(page)).toEqual([])
  })
})

test.describe('fiche joueur : accessibilité', () => {
  test('0 violation axe, un seul h1, aucun email ni téléphone, aucun ratio', async ({ page }) => {
    const id = await mostTitledPlayerId(page)
    await page.goto(`/joueurs/${id}`)
    await page.waitForLoadState('networkidle')
    expect(await violationsOf(page)).toEqual([])
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByTestId('player-compare')).toHaveAttribute('href', `/joueurs/face-a-face?a=${id}`)
    const text = await page.locator('main').innerText()
    expect(text).not.toMatch(/@|\b0\d[ .]?\d\d[ .]?\d\d[ .]?\d\d[ .]?\d\d\b/)
    await expect(page.getByTestId('player-stats')).not.toContainText('%')
  })

  test('le parcours donne le même contenu que le graphique : un tableau nommé, du plus récent au plus ancien', async ({ page }) => {
    const id = await mostTitledPlayerId(page)
    await page.goto(`/joueurs/${id}`)
    await page.waitForLoadState('networkidle')
    const years = (await page.locator('[data-cy="player-journey-table"] tbody tr td:first-child').allTextContents()).map(text => Number.parseInt(text, 10))
    expect(years.length).toBeGreaterThan(0)
    expect([...years].sort((a, b) => b - a)).toEqual(years)
    await expect(page.getByTestId('player-journey-chart')).toHaveAttribute('aria-hidden', 'true')
  })

  test('chaque adversaire a un lien « Face-à-face avec X » au nom accessible complet', async ({ page }) => {
    const id = await mostTitledPlayerId(page)
    await page.goto(`/joueurs/${id}`)
    await page.waitForLoadState('networkidle')
    const links = page.getByTestId('player-opponent-link')
    expect(await links.count()).toBeGreaterThan(0)
    expect(await links.first().textContent()).toMatch(/Face-à-face\s+avec\s+\S+/)
    expect(await links.first().getAttribute('href')).toContain(`/joueurs/face-a-face?a=${id}&b=`)
  })

  test('les pastilles pleines (primary et secondary) ont le texte nuit rgb(22, 11, 46), sans contraste forcé', async ({ page }) => {
    const id = await mostTitledPlayerId(page)
    await page.goto(`/joueurs/${id}`)
    await page.waitForLoadState('networkidle')
    const chips = page.locator('[data-cy="player-titles"], [data-cy="player-journey-table"] .origam-chip')
    const count = await chips.count()
    expect(count).toBeGreaterThan(0)
    for (let index = 0; index < count; index += 1) {
      const chip = chips.nth(index)
      await expect(chip).toHaveCSS('color', 'rgb(22, 11, 46)')
      await expect(chip).not.toHaveAttribute('data-origam-contrast-fixed', /.*/)
    }
  })

  test('au-dessus de 4 adversaires, « Voir tous » existe, pointe vers le face-à-face du joueur et est atteint au clavier', async ({ page }) => {
    const opponents = await (await page.request.get(`/api/v1/competiteurs/${PLAYER_WITH_FIVE_OPPONENTS}/face-a-face`)).json() as unknown[]
    expect(opponents).toHaveLength(5)
    await page.goto(`/joueurs/${PLAYER_WITH_FIVE_OPPONENTS}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('player-opponent')).toHaveCount(4)
    const link = page.getByTestId('player-opponents-see-all')
    await expect(link).toBeVisible()
    await expect(link).toHaveText('Voir les 5 adversaires →')
    await expect(link).toHaveAttribute('href', `/joueurs/face-a-face?a=${PLAYER_WITH_FIVE_OPPONENTS}`)
    await link.focus()
    await expect(link).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`/joueurs/face-a-face\\?a=${PLAYER_WITH_FIVE_OPPONENTS}`))
  })

  test('avec 4 adversaires ou moins, le lien « Voir tous » est absent', async ({ page }) => {
    const opponents = await (await page.request.get(`/api/v1/competiteurs/${PLAYER_WITH_FOUR_OPPONENTS}/face-a-face`)).json() as unknown[]
    expect(opponents).toHaveLength(4)
    await page.goto(`/joueurs/${PLAYER_WITH_FOUR_OPPONENTS}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('player-opponent')).toHaveCount(4)
    await expect(page.getByTestId('player-opponents-see-all')).toHaveCount(0)
  })

  test('un identifiant inconnu répond 404 et affiche un état « introuvable » accessible', async ({ page }) => {
    const response = await page.goto(`/joueurs/${UNKNOWN_ID}`)
    expect(response?.status()).toBe(404)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('async-state-empty')).toContainText('Joueur introuvable')
    expect(await violationsOf(page)).toEqual([])
  })
})
