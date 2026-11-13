import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createDrawnEdition, createTiedPoolsEdition, playMatch, selectAdminEdition } from '../helpers/edition-write'
import type { IAdminMatchView } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-24 : admin, qualification (écritures sur des éditions créées par le test, jamais 2026)
 *
 * @description
 * Chaque test crée SON édition par l'API réelle (inscrits, tirage des poules par les routes B-11, scores par B-12, comme `createTiedPoolsEdition`) : l'état dont l'écran
 * a besoin (matchs à valider, égalité entre poules, liste prête) se fabrique par l'API et ne passe jamais par la saisie de score de l'écran (décision, F-08 est testé ailleurs).
 * Égalité entre poules : 3 poules de 2 joueurs, chaque match 5-2, donc 3 perdants à égalité pour une place de meilleur 2e (n = 1, m = 1).
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

const openQualification = async (page: Page) => {
  await page.goto(PAGE)
  await hydrated(page)
  await expect(page.getByTestId('qualification-parameters')).toBeVisible()
}

const typeParameter = async (page: Page, testId: string, value: string) => {
  await page.getByTestId(testId).locator('input').fill(value)
}

const adminMatches = async (page: Page, editionId: string): Promise<Array<IAdminMatchView & { status: string, targetScore: number }>> =>
  (await (await page.request.get(`/api/v1/admin/editions/${editionId}/matchs`)).json()) as Array<IAdminMatchView & { status: string, targetScore: number }>

test.describe('admin qualification : écritures sur une édition créée par le test', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('/admin/phase-finale mène à la qualification, l’entrée « Phase finale » du tiroir est la page courante, 0 violation axe', async ({ page, context }) => {
    const { edition } = await createTiedPoolsEdition(context.request, 'f24 redirect', 3)
    await selectAdminEdition(context, edition)
    await page.goto('/admin/phase-finale')
    await hydrated(page)
    await expect(page).toHaveURL(new RegExp(`${PAGE}$`))
    await expect(page.getByTestId('page-title')).toHaveText('Qualification')
    await expect(page.getByRole('link', { name: 'Phase finale' }).first()).toHaveAttribute('aria-current', 'true')
    await expect(page.getByTestId('phase-steps').locator('button')).toHaveCount(0)
    expect(await violationsOf(page)).toEqual([])
  })

  test('des matchs à valider : progression, actions inactives avec leur raison, 0 violation axe', async ({ page, context }) => {
    const { edition } = await createDrawnEdition(context.request, 'f24 matchs', 4, 2)
    await selectAdminEdition(context, edition)
    const matches = await adminMatches(page, edition.id)
    await playMatch(context.request, matches[0]!, [5, 2])
    await openQualification(page)
    await expect(page.getByTestId('qualification-prerequisites-count')).toHaveText('1 / 2')
    await expect(page.getByTestId('qualification-matches-link')).toContainText('Voir le match restant')
    await expect(page.getByTestId('qualification-finalize-open')).toBeDisabled()
    await expect(page.getByTestId('qualification-finalize-why')).toHaveText('Indisponible : 1 match de poule à valider.')
    expect(await violationsOf(page)).toEqual([])
  })

  test('un paramètre hors bornes est refusé par écrit et rien n’est envoyé ; un paramètre valide relance l’aperçu', async ({ page, context }) => {
    const { edition } = await createTiedPoolsEdition(context.request, 'f24 params', 3)
    await selectAdminEdition(context, edition)
    await openQualification(page)
    await expect(page.getByTestId('qualification-preview')).toContainText('Aperçu : 6 qualifiés')
    await typeParameter(page, 'qualification-top-per-pool', '9')
    await expect(page.getByTestId('qualification-parameters')).toContainText('Valeur trop haute : maximum 2.')
    await expect(page.getByTestId('qualification-preview')).toHaveCount(0)
    await expect(page.getByTestId('qualification-finalize-open')).toBeDisabled()
    expect(await violationsOf(page)).toEqual([])
    await typeParameter(page, 'qualification-top-per-pool', '1')
    await expect(page.getByTestId('qualification-preview')).toContainText('Aperçu : 3 qualifiés')
  })

  test('égalité entre poules : la simulation la montre, le départage se crée, il se joue ailleurs, puis la liste s’arrête (définitif)', async ({ page, context }) => {
    const { edition } = await createTiedPoolsEdition(context.request, 'f24 egalite', 3)
    await selectAdminEdition(context, edition)
    await openQualification(page)
    await expect(page.getByTestId('qualification-no-ties')).toBeVisible()

    await typeParameter(page, 'qualification-top-per-pool', '1')
    await typeParameter(page, 'qualification-best-next', '1')
    const tie = page.getByTestId('qualification-tie-0')
    await expect(tie).toBeVisible()
    await expect(tie).toContainText('Meilleur 2e entre poules · 3 joueurs')
    await expect(tie).toContainText('Places restantes : 1.')
    await expect(tie).toContainText('Départage non créé')
    await expect(page.getByTestId('qualification-finalize-open')).toBeDisabled()
    await expect(page.getByTestId('qualification-finalize-why')).toHaveText('Indisponible : 1 égalité restante.')
    expect(await violationsOf(page)).toEqual([])

    await page.getByTestId('qualification-create-tiebreak-0').click()
    await expect(page.getByTestId('qualification-tie-0')).toContainText('Départage créé, à jouer')
    await expect(page.getByTestId('qualification-create-tiebreak-0')).toBeDisabled()
    const link = page.getByTestId('qualification-tie-score-link-0')
    await expect(link).toHaveAttribute('href', '/admin/matchs?departages=1')
    const tiebreak = (await adminMatches(page, edition.id)).find(match => match.purpose === 'TIEBREAK')!
    expect(tiebreak.sides).toHaveLength(3)
    expect(tiebreak.targetScore).toBe(3)
    expect(await violationsOf(page)).toEqual([])

    await playMatch(context.request, tiebreak, [3, 1, 0])
    await page.reload()
    await hydrated(page)
    await expect(page.getByTestId('qualification-parameters')).toBeVisible()
    await typeParameter(page, 'qualification-top-per-pool', '1')
    await typeParameter(page, 'qualification-best-next', '1')
    await expect(page.getByTestId('qualification-no-ties')).toBeVisible()
    await expect(page.getByTestId('qualification-qualified')).toContainText('Après départage')
    await expect(page.getByTestId('qualification-finalize-open')).toBeEnabled()
    expect(await violationsOf(page)).toEqual([])

    await page.getByTestId('qualification-finalize-open').click()
    const dialog = page.getByTestId('qualification-finalize-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('il n’est pas possible de revenir en arrière')
    await expect(page.getByTestId('qualification-finalize-cancel')).toBeFocused()
    expect(await violationsOf(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    expect((await (await page.request.get(`/api/v1/editions/${edition.id}`)).json() as { status: string }).status).not.toBe('QUALIFIED')

    await page.getByTestId('qualification-finalize-open').click()
    await page.getByTestId('qualification-finalize-confirm').click()
    await expect(page.getByTestId('qualification-finalized')).toBeVisible()
    await expect(page.getByTestId('qualification-snackbar')).toContainText('Liste des qualifiés arrêtée')
    await expect(page.getByTestId('qualification-finalize-open')).toHaveCount(0)
    await expect(page.getByTestId('qualification-top-per-pool').locator('input')).toBeDisabled()
    const detail = await (await page.request.get(`/api/v1/editions/${edition.id}`)).json() as { status: string }
    expect(detail.status).toBe('QUALIFIED')
    expect(await violationsOf(page)).toEqual([])
  })
})
