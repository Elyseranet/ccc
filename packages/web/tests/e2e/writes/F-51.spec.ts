import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { createFinalValidatedEdition, createQualifiedEdition, selectAdminEdition } from '../helpers/edition-write'
import type { IWriteEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-51 : admin, « Rouvrir les qualifications » (écritures sur des éditions créées par le test, jamais 2026)
 *
 * @description
 * Chaque test crée SON édition par l'API réelle (`createQualifiedEdition` : liste des qualifiés arrêtée, 4 poules = 8 joueurs = quarts, 2 poules = 4 joueurs = demies).
 * Le brouillon du tirage de tour et sa validation (cas « refusé ») passent par les routes réelles de B-11/B-25, jamais par une écriture en base.
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const PAGE = '/admin/phase-finale/qualification'
const STATUS_OK = 200
const STATUS_CONFLICT = 409

interface IDrawResponse { id: string, kind: string, status: string }

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
  await expect(page.getByTestId('qualification-finalized')).toBeVisible()
}

const editionStatus = async (request: APIRequestContext, edition: IWriteEdition): Promise<string> =>
  ((await (await request.get(`/api/v1/editions/${edition.id}`)).json()) as { status: string }).status

const roundDrafts = async (request: APIRequestContext, edition: IWriteEdition): Promise<IDrawResponse[]> =>
  ((await (await request.get(`/api/v1/admin/editions/${edition.id}/tirages`)).json()) as IDrawResponse[]).filter(draw => draw.kind === 'ROUND' && draw.status === 'DRAFT')

/** Ouvre le brouillon du tirage de tour et y place `pairings` affiches complètes (le vivier est celui de l'aperçu). */
const createDraft = async (request: APIRequestContext, edition: IWriteEdition, pairings: number): Promise<string> => {
  const preview = (await (await request.get(`/api/v1/admin/editions/${edition.id}/tirages/tour`)).json()) as { candidates: Array<{ participationId: string }> }
  const created = await request.post(`/api/v1/editions/${edition.id}/tirages/tour`, { data: {} })
  expect(created.status()).toBe(201)
  const draw = (await created.json()) as IDrawResponse
  const assignments = Array.from({ length: pairings }, (_, index) => [
    { participationId: preview.candidates[index * 2]!.participationId, pairingIndex: index + 1, sidePosition: 1, drawnOrder: index * 2 + 1 },
    { participationId: preview.candidates[index * 2 + 1]!.participationId, pairingIndex: index + 1, sidePosition: 2, drawnOrder: index * 2 + 2 }
  ]).flat()
  const saved = await request.put(`/api/v1/tirages/${draw.id}/affectations`, { data: { assignments } })
  expect(saved.status()).toBe(STATUS_OK)
  return draw.id
}

/** Un tirage de tour complet (toutes les affiches) puis sa validation : l'édition passe à PLAYOFFS. */
const validateFirstRound = async (request: APIRequestContext, edition: IWriteEdition, pairings: number) => {
  const drawId = await createDraft(request, edition, pairings)
  const validated = await request.post(`/api/v1/tirages/${drawId}/validation`)
  expect(validated.status()).toBe(STATUS_OK)
}

test.describe('admin qualification : rouvrir la liste arrêtée', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('sans brouillon : raison, confirmation (focus sur Annuler, Échap annule, 0 violation axe), puis retour à la saisie des paramètres et snackbar', async ({ page, context }) => {
    const edition = await createQualifiedEdition(context.request, 'f51 sans brouillon', 4)
    await selectAdminEdition(context, edition)
    await openQualification(page)
    const open = page.getByTestId('qualification-reopen-open')
    await expect(open).toBeEnabled()
    await expect(open).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(page.getByTestId('qualification-reopen-why')).toHaveText('Possible tant que le tirage des quarts n’est pas validé.')
    await expect(page.getByTestId('qualification-finalize-count')).toHaveText('8 qualifiés')
    expect(await violationsOf(page)).toEqual([])

    await open.click()
    const dialog = page.getByTestId('qualification-reopen-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('La liste des 8 qualifiés est annulée')
    await expect(dialog).toContainText('Il faudra arrêter la liste à nouveau avant le tirage des quarts.')
    await expect(page.getByTestId('qualification-reopen-cancel')).toBeFocused()
    await expect(page.getByTestId('qualification-reopen-confirm')).toHaveText('Rouvrir les qualifications')
    expect(await violationsOf(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    expect(await editionStatus(context.request, edition)).toBe('QUALIFIED')

    await open.click()
    await page.getByTestId('qualification-reopen-confirm').click()
    await expect(page.getByTestId('qualification-reopened-snackbar')).toContainText('Qualifications rouvertes : ajustez les paramètres puis arrêtez la liste')
    await expect(page.getByTestId('qualification-finalized')).toHaveCount(0)
    await expect(page.getByTestId('qualification-reopen')).toHaveCount(0)
    await expect(page.getByTestId('qualification-top-per-pool').locator('input')).toBeEnabled()
    await expect(page.getByTestId('qualification-finalize-open')).toBeEnabled()
    expect(await editionStatus(context.request, edition)).toBe('POOLS_DRAWN')
    expect(await violationsOf(page)).toEqual([])
  })

  test('avec un brouillon de tirage : le tour et le nombre d’affiches sont dits, le bouton est danger, le brouillon est effacé', async ({ page, context }) => {
    const edition = await createQualifiedEdition(context.request, 'f51 brouillon', 4)
    await createDraft(context.request, edition, 2)
    expect(await roundDrafts(context.request, edition)).toHaveLength(1)
    await selectAdminEdition(context, edition)
    await openQualification(page)
    await page.getByTestId('qualification-reopen-open').click()
    const dialog = page.getByTestId('qualification-reopen-dialog')
    await expect(dialog).toBeVisible()
    await expect(page.getByTestId('qualification-reopen-draft').locator('strong')).toHaveText('Le brouillon du tirage des quarts sera effacé')
    await expect(page.getByTestId('qualification-reopen-draft')).toContainText('(2 affiches saisies) et ne pourra pas être récupéré.')
    await expect(page.getByTestId('qualification-reopen-confirm')).toHaveText('Rouvrir et effacer le brouillon')
    await expect(page.getByTestId('qualification-reopen-cancel')).toBeFocused()
    expect(await violationsOf(page)).toEqual([])

    await page.getByTestId('qualification-reopen-confirm').click()
    await expect(page.getByTestId('qualification-reopened-snackbar')).toBeVisible()
    await expect(page.getByTestId('qualification-finalized')).toHaveCount(0)
    expect(await roundDrafts(context.request, edition)).toHaveLength(0)
    expect(await editionStatus(context.request, edition)).toBe('POOLS_DRAWN')
  })

  test('tirage du premier tour validé : bouton inactif avec sa raison, et le serveur refuse (409 QUALIFICATION_LOCKED), 0 violation axe', async ({ page, context }) => {
    const edition = await createFinalValidatedEdition(context.request, 'f51 refus', false)
    await selectAdminEdition(context, edition)
    await openQualification(page)
    await expect(page.getByTestId('qualification-reopen-open')).toBeDisabled()
    await expect(page.getByTestId('qualification-reopen-why')).toHaveText('Indisponible : le tirage de la finale est validé.')
    expect(await violationsOf(page)).toEqual([])
    const refused = await context.request.delete(`/api/v1/editions/${edition.id}/qualification`)
    expect(refused.status()).toBe(STATUS_CONFLICT)
    expect(((await refused.json()) as { code: string }).code).toBe('QUALIFICATION_LOCKED')
    expect(await editionStatus(context.request, edition)).toBe('PLAYOFFS')
  })

  test('tirage validé entre-temps : 409 affiché avec le tour, « Recharger » rend le bouton inactif', async ({ page, context }) => {
    const edition = await createQualifiedEdition(context.request, 'f51 entre-temps', 2)
    await selectAdminEdition(context, edition)
    await openQualification(page)
    await expect(page.getByTestId('qualification-reopen-open')).toBeEnabled()
    await validateFirstRound(context.request, edition, 2)

    await page.getByTestId('qualification-reopen-open').click()
    await page.getByTestId('qualification-reopen-confirm').click()
    const failure = page.getByTestId('qualification-failure')
    await expect(failure).toContainText('Le tirage des demi-finales a été validé entre-temps : les qualifications ne peuvent plus être rouvertes.')
    await expect(page.getByTestId('qualification-reopen-dialog')).toHaveCount(0)
    await expect(page.getByTestId('qualification-finalized')).toBeVisible()
    expect(await violationsOf(page)).toEqual([])
    await page.getByTestId('qualification-reload').click()
    await expect(failure).toHaveCount(0)
    await expect(page.getByTestId('qualification-reopen-open')).toBeDisabled()
    await expect(page.getByTestId('qualification-reopen-why')).toHaveText('Indisponible : le tirage des demi-finales est validé.')
  })
})
