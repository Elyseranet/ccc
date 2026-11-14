import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createTiedPoolsEdition, selectAdminEdition } from '../helpers/edition-write'
import type { IAdminMatchView } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-44 : admin, supprimer un départage non joué (CORRECTION-TIEBREAK, B-24)
 *
 * @description
 * Chaque test crée SON édition par l'API réelle (3 poules de 2, chaque match 5-2 : 3 perdants à égalité pour une place de « meilleur 2e », comme F-24). Le départage se crée par l'écran ;
 * le score se saisit par l'API (jamais par l'écran : F-08 est testé ailleurs).
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const PAGE = '/admin/phase-finale/qualification'

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
}

type TAdminMatch = IAdminMatchView & { status: string, targetScore: number }
const adminMatches = async (page: Page, editionId: string): Promise<TAdminMatch[]> =>
  (await (await page.request.get(`/api/v1/admin/editions/${editionId}/matchs`)).json()) as TAdminMatch[]
const tiebreakOf = async (page: Page, editionId: string) => (await adminMatches(page, editionId)).find(match => match.purpose === 'TIEBREAK')

/** Une édition à égalité entre poules, avec un départage créé par l'écran (« Créer le départage »). */
const openWithTiebreak = async (page: Page, context: Parameters<typeof selectAdminEdition>[0], label: string) => {
  const { edition } = await createTiedPoolsEdition(context.request, label, 3)
  await selectAdminEdition(context, edition)
  await page.goto(PAGE)
  await hydrated(page)
  await expect(page.getByTestId('qualification-parameters')).toBeVisible()
  await page.getByTestId('qualification-top-per-pool').locator('input').fill('1')
  await page.getByTestId('qualification-best-next').locator('input').fill('1')
  await expect(page.getByTestId('qualification-tie-0')).toBeVisible()
  await page.getByTestId('qualification-create-tiebreak-0').click()
  await expect(page.getByTestId('qualification-delete-tiebreak-0')).toBeVisible()
  return edition
}

/** Saisit (sans valider) un score sur le départage : il devient « joué ». */
const recordScore = async (page: Page, match: TAdminMatch) => {
  const scores = match.sides.map((side, index) => ({ participationId: side.participationId, score: [3, 1, 0][index]! }))
  const response = await page.request.put(`/api/v1/matchs/${match.id}/score`, { data: { scores }, headers: { 'If-Match': `"${match.version}"` } })
  expect(response.status()).toBe(200)
}

test.describe('admin qualification : supprimer un départage non joué', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('annuler ne supprime rien ; confirmer supprime, l’égalité revient et le départage se recrée, 0 violation axe', async ({ page, context }) => {
    const edition = await openWithTiebreak(page, context, 'f44 supprimer')
    const tie = page.getByTestId('qualification-tie-0')
    await expect(tie).toContainText('Départage créé · ')
    await expect(tie).toContainText('À jouer')
    await expect(page.getByTestId('qualification-tie-delete-why-0')).toHaveText('Tant que ce départage existe, les scores des poules ne peuvent pas être corrigés.')
    expect(await violationsOf(page)).toEqual([])

    await page.getByTestId('qualification-delete-tiebreak-0').click()
    const dialog = page.getByTestId('qualification-delete-tiebreak-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Supprimer le départage ?')
    await expect(dialog).toContainText('n’a pas été joué')
    await expect(dialog).toContainText('Les scores des poules peuvent alors être corrigés.')
    await expect(page.getByTestId('qualification-delete-tiebreak-cancel')).toBeFocused()
    expect(await violationsOf(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    expect(await tiebreakOf(page, edition.id)).toBeDefined()

    await page.getByTestId('qualification-delete-tiebreak-0').click()
    await page.getByTestId('qualification-delete-tiebreak-confirm').click()
    await expect(page.getByTestId('qualification-deleted-snackbar')).toContainText('Départage supprimé : l’égalité est à départager')
    await expect(tie).toContainText('Départage non créé')
    expect(await tiebreakOf(page, edition.id)).toBeUndefined()
    expect(await violationsOf(page)).toEqual([])

    await page.getByTestId('qualification-create-tiebreak-0').click()
    await expect(page.getByTestId('qualification-delete-tiebreak-0')).toBeVisible()
    expect(await tiebreakOf(page, edition.id)).toBeDefined()
  })

  test('un départage joué (score saisi) : « Saisi · à valider », suppression inactive avec sa raison', async ({ page, context }) => {
    const edition = await openWithTiebreak(page, context, 'f44 joue')
    await recordScore(page, (await tiebreakOf(page, edition.id))!)
    await page.reload()
    await hydrated(page)
    await page.getByTestId('qualification-top-per-pool').locator('input').fill('1')
    await page.getByTestId('qualification-best-next').locator('input').fill('1')
    await expect(page.getByTestId('qualification-tie-0')).toContainText('Saisi · à valider')
    await expect(page.getByTestId('qualification-delete-tiebreak-0')).toBeDisabled()
    await expect(page.getByTestId('qualification-tie-delete-why-0')).toHaveText('Indisponible : départage joué.')
    expect(await violationsOf(page)).toEqual([])
  })

  test('409 TIEBREAK_PLAYED : le départage est joué pendant que le dialogue est ouvert, le message le dit et rien n’est supprimé', async ({ page, context }) => {
    const edition = await openWithTiebreak(page, context, 'f44 409')
    await page.getByTestId('qualification-delete-tiebreak-0').click()
    await expect(page.getByTestId('qualification-delete-tiebreak-dialog')).toBeVisible()
    await recordScore(page, (await tiebreakOf(page, edition.id))!)
    await page.getByTestId('qualification-delete-tiebreak-confirm').click()
    const failure = page.getByTestId('qualification-failure')
    await expect(failure).toContainText('Le départage a été joué entre-temps : il ne peut plus être supprimé.')
    await expect(page.getByTestId('qualification-reload')).toBeVisible()
    expect(await tiebreakOf(page, edition.id)).toBeDefined()
    expect(await violationsOf(page)).toEqual([])
    await page.getByTestId('qualification-reload').click()
    await expect(page.getByTestId('qualification-tie-0')).toContainText('Saisi · à valider')
  })
})
