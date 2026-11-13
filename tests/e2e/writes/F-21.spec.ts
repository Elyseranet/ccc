import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createMultiTiebreakEdition, selectAdminEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-21 : départage à 3 côtés ou plus, cartes de la file et formulaire de score (écritures, a11y)
 *
 * @description
 * Chaque test crée SON édition et SON départage par l'API réelle (`createMultiTiebreakEdition`, B-13) : aucun match d'archive ni de 2026
 * n'est touché. Les mêmes écrans sont mesurés contre la maquette dans `F-21.zones.spec.ts`.
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const SIDE_COUNTS = [3, 4]

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

const violationsOf = async (page: Page, scope?: string) => {
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)
  const results = await (scope ? builder.include(scope) : builder).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
}

test.describe('admin matchs : départage à N côtés sur une édition créée par le test', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  for (const sideCount of SIDE_COUNTS) {
    test(`${sideCount} côtés : carte en liste, formulaire empilé sans « – », saisie puis validation, 0 violation axe`, async ({ page, context }) => {
      const { edition, tiebreak } = await createMultiTiebreakEdition(context.request, `f21 ${sideCount} cotes`, sideCount)
      expect(tiebreak.sides).toHaveLength(sideCount)
      expect(tiebreak.targetScore).toBe(3)
      await selectAdminEdition(context, edition)
      await page.goto('/admin/matchs')
      await hydrated(page)

      const sides = page.getByTestId(`admin-match-sides-${tiebreak.id}`)
      await expect(sides).toBeVisible()
      await expect(sides.locator('li')).toHaveCount(sideCount)
      await expect(sides).not.toContainText('–')
      await expect(page.getByTestId(`admin-match-${tiebreak.id}`)).toContainText('Départage')
      expect(await violationsOf(page)).toEqual([])

      await page.getByTestId(`admin-match-enter-${tiebreak.id}`).click()
      const form = page.getByTestId('admin-score-form')
      await expect(form).toBeVisible()
      await expect(form.locator('[data-cy^="admin-score-input-"] input')).toHaveCount(sideCount)
      await expect(form.locator('.score-entry-form__vs')).toHaveCount(0)
      await expect(page.getByTestId('admin-score-rule')).toContainText('Cible 3')
      expect(await violationsOf(page)).toEqual([])

      const scores = [3, 1, 0, 2].slice(0, sideCount)
      for (const [index, score] of scores.entries()) {
        await page.getByTestId(`admin-score-input-${index}`).locator('input').fill(String(score))
      }
      await expect(page.getByTestId('admin-score-validate')).toHaveText(`Valider ${scores.join('–')}`)
      await page.getByTestId('admin-score-validate').click()
      await expect(page.getByTestId('admin-score-dialog')).toHaveCount(0)
      const validated = (await (await page.request.get(`/api/v1/admin/editions/${edition.id}/matchs`)).json() as Array<{ id: string, status: string, sides: Array<{ score: number | null }> }>).find(match => match.id === tiebreak.id)!
      expect(validated.status).toBe('VALIDATED')
      expect(validated.sides.map(side => side.score)).toEqual(scores)
      await page.goto('/admin/matchs?f=valides')
      await hydrated(page)
      await expect(page.getByTestId(`admin-match-sides-${tiebreak.id}`).locator('.match-queue__side-value')).toHaveText(scores.map(String))

      await page.goto(`/editions/${edition.code}?onglet=matchs`)
      await hydrated(page)
      const row = page.getByTestId('edition-matches-table').locator('tbody tr').filter({ hasText: 'départage' })
      await expect(row.locator('.edition-matches__score')).toHaveText(scores.join(' – '))
      await expect(row.locator('.edition-matches__others li')).toHaveCount(sideCount - 1)
      expect(await violationsOf(page, '[data-cy="edition-matches-table"]')).toEqual([])
    })
  }
})
