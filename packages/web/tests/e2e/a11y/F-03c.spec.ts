import { expect, test } from '@playwright/test'

/*********************************************************
 * Podium de l'édition : étoiles du finaliste et des demi-finalistes (F-03c, B-19)
 *
 * @description
 * Sur les données réelles de la base de test : chaque étoile affichée est celle de l'API, dans l'ordre du serveur,
 * sans re-tri. Le bloc du champion n'a pas d'étoiles (traitement de titre, pas un PlayerLink).
 ********************************************************/
interface IPodiumEntry { competitor: { displayName: string }, titlesToDate: number }
interface IEditionPodiumData { champion: unknown, final: { runnerUp: { displayName: string }, runnerUpTitlesToDate: number } | null, semiFinalists: IPodiumEntry[] }

const CODES = ['2025', '2024', '2021', '2016', '2012a']

for (const code of CODES) {
  test(`édition ${code} : étoiles du finaliste et des demi-finalistes = celles de l'API, dans l'ordre du serveur`, async ({ page, request }) => {
    const data = await (await request.get(`/api/v1/editions/${code}`)).json() as IEditionPodiumData
    await page.goto(`/editions/${code}`)
    await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
    const places = page.locator('.edition-summary__place')
    const expected = [
      ...(data.final ? [{ name: data.final.runnerUp.displayName, titles: data.final.runnerUpTitlesToDate }] : []),
      ...data.semiFinalists.map(entry => ({ name: entry.competitor.displayName, titles: entry.titlesToDate }))
    ]
    await expect(places).toHaveCount(expected.length)
    for (const [index, entry] of expected.entries()) {
      const place = places.nth(index)
      await expect(place.locator('.player-link__name')).toHaveText(entry.name)
      if (entry.titles > 0) {
        await expect(place.locator('.player-link__stars')).toHaveText('*'.repeat(entry.titles))
      } else {
        await expect(place.locator('.player-link__stars')).toHaveCount(0)
      }
    }
    await expect(page.locator('.edition-summary__champ .player-link__stars')).toHaveCount(0)
  })
}

test('au moins une des éditions testées a un finaliste et un demi-finaliste avec des titres', async ({ request }) => {
  const editions = await Promise.all(CODES.map(async code => await (await request.get(`/api/v1/editions/${code}`)).json() as IEditionPodiumData))
  expect(editions.some(edition => (edition.final?.runnerUpTitlesToDate ?? 0) > 0)).toBe(true)
  expect(editions.some(edition => edition.semiFinalists.some(entry => entry.titlesToDate > 0))).toBe(true)
})

test('édition en phase de poules (2026) : aucun podium, aucune ligne de finaliste ni de demi-finaliste, aucune étoile', async ({ page, request }) => {
  const data = await (await request.get('/api/v1/editions/2026')).json() as IEditionPodiumData
  expect(data.champion).toBeNull()
  expect(data.final).toBeNull()
  expect(data.semiFinalists).toEqual([])
  await page.goto('/editions/2026')
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await expect(page.getByTestId('edition-podium')).toHaveCount(0)
  await expect(page.locator('.edition-summary__place')).toHaveCount(0)
  await expect(page.locator('.edition-summary .player-link__stars')).toHaveCount(0)
  await expect(page.getByText('Demi-finale', { exact: true })).toHaveCount(0)
  await expect(page.getByTestId('edition-steps')).toBeVisible()
})
