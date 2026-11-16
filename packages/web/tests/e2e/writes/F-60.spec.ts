import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { E2E_ADMIN_EDITION_COOKIE } from '../helpers/e2e.const'
import { createFinalValidatedEdition, createRegistrationEdition, selectAdminEdition } from '../helpers/edition-write'
import { markAwaitingRoutes } from '../helpers/pending-routes'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-60 : admin, suppression d'une édition (écritures sur des éditions créées par le test, jamais une archive ni 2026)
 *
 * @description
 * Le dialogue (libellé visible lié au champ, focus, Échap, code exigé) ne dépend pas de la route serveur : il tourne dès maintenant. Les cas qui
 * suppriment réellement (`DELETE /editions/{id}`) attendent B-28 : tant que `API_ROUTES[EDITION_DELETE].pendingTicket` existe ils sont en
 * `test.fixme`, et ils s'activent seuls quand B-28 retire ce ticket (même commit que la route).
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const STATUS_NOT_FOUND = 404
const STATUS_CONFLICT = 409
const ADMIN_PAGE = '/admin/editions/:code'

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await expect(page.getByTestId('page-title')).toBeVisible()
}

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => `${node.target.join(' ')} :: ${node.html.slice(0, 260)}`).join(', ')}`)
}

const awaitingDeleteRoute = (): boolean => markAwaitingRoutes(ADMIN_PAGE).length > 0

test.describe('admin suppression d’édition : dialogue de confirmation', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('édition en cours : zone « danger », libellé visible lié au champ, focus sur le champ, Échap annule sans rien supprimer, 0 violation axe', async ({ page, context }) => {
    const { edition } = await createRegistrationEdition(context.request, 'f60 dialogue')
    await page.goto(`/admin/editions/${edition.code}`)
    await hydrated(page)
    await expect(page.getByTestId('edition-delete-zone')).toBeVisible()
    await expect(page.getByTestId('edition-delete-zone')).toContainText('Zone de danger')
    await page.getByTestId('edition-delete-open').click()
    const dialog = page.getByTestId('edition-delete-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(`Supprimer l’édition ${edition.code} ?`)
    await expect(dialog).toContainText('les participants inscrits, les poules, les tirages et les matchs')
    await expect(dialog).toContainText('définitive')
    await expect(dialog).not.toContainText('classements')
    const label = dialog.getByText(`Pour confirmer, saisissez le code de l’édition : ${edition.code}`)
    await expect(label).toBeVisible()
    const input = page.getByTestId('edition-delete-code').locator('input')
    await expect(page.getByLabel(`Pour confirmer, saisissez le code de l’édition : ${edition.code}`)).toHaveCount(1)
    await expect(input).toBeFocused()
    await expect(page.getByTestId('edition-delete-confirm')).toBeDisabled()
    await input.fill('0000')
    await expect(page.getByTestId('edition-delete-confirm')).toBeDisabled()
    await input.fill(edition.code)
    await expect(page.getByTestId('edition-delete-confirm')).toBeEnabled()
    expect(await violationsOf(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('edition-delete-open')).toBeFocused()
    expect((await context.request.get(`/api/v1/editions/${edition.id}`)).status()).toBe(200)
  })

  test('édition clôturée : la zone existe et le dialogue annonce que ses points quittent les classements', async ({ page, context }) => {
    const edition = await createFinalValidatedEdition(context.request, 'f60 cloturee')
    expect((await context.request.post(`/api/v1/editions/${edition.id}/cloture`)).status()).toBe(200)
    await page.goto(`/admin/editions/${edition.code}`)
    await hydrated(page)
    await page.getByTestId('edition-delete-open').click()
    await expect(page.getByTestId('edition-delete-dialog')).toContainText('ses points disparaîtront des classements')
  })

  test('archive : aucune zone « danger » sur la fiche', async ({ page, context }) => {
    await page.goto('/admin/editions/2012a')
    await hydrated(page)
    await expect(page.getByTestId('edition-closed')).toBeVisible()
    await expect(page.getByTestId('edition-delete-zone')).toHaveCount(0)
    expect((await context.request.get('/api/v1/editions/2012a')).status()).toBe(200)
  })
})

test.describe('admin suppression d’édition : suppression réelle (B-28)', () => {
  test.beforeEach(async ({ context }) => {
    test.fixme(awaitingDeleteRoute(), 'DELETE /editions/{id} : en attente de B-28')
    await signIn(context, 'admin')
  })

  test('code saisi puis confirmation : retour à la liste, snackbar, l’édition n’existe plus, l’édition active (cookie) retombe sur la règle par défaut', async ({ page, context }) => {
    const { edition } = await createRegistrationEdition(context.request, 'f60 suppression')
    await selectAdminEdition(context, edition)
    await page.goto(`/admin/editions/${edition.code}`)
    await hydrated(page)
    await page.getByTestId('edition-delete-open').click()
    await page.getByTestId('edition-delete-code').locator('input').fill(edition.code)
    await page.getByTestId('edition-delete-confirm').click()
    await expect(page).toHaveURL(/\/admin\/editions$/)
    await expect(page.getByTestId('editions-deleted')).toContainText(`Édition ${edition.code} supprimée`)
    expect((await context.request.get(`/api/v1/editions/${edition.id}`)).status()).toBe(STATUS_NOT_FOUND)
    await expect(page.getByTestId('editions-table')).not.toContainText(edition.code)
    const cookie = (await context.cookies()).find(entry => entry.name === E2E_ADMIN_EDITION_COOKIE)
    expect(cookie?.value).not.toBe(edition.id)
  })

  test('archive : l’API refuse 409 et rien n’est supprimé', async ({ context }) => {
    const response = await context.request.delete('/api/v1/editions/2012a')
    expect(response.status()).toBe(STATUS_CONFLICT)
    expect((await response.json() as { code: string }).code).toBe('EDITION_LEGACY_PROTECTED')
    expect((await context.request.get('/api/v1/editions/2012a')).status()).toBe(200)
  })

  test('édition clôturée supprimée par l’écran', async ({ page, context }) => {
    const edition = await createFinalValidatedEdition(context.request, 'f60 cloturee supprimee')
    expect((await context.request.post(`/api/v1/editions/${edition.id}/cloture`)).status()).toBe(200)
    await page.goto(`/admin/editions/${edition.code}`)
    await hydrated(page)
    await page.getByTestId('edition-delete-open').click()
    await page.getByTestId('edition-delete-code').locator('input').fill(edition.code)
    await page.getByTestId('edition-delete-confirm').click()
    await expect(page).toHaveURL(/\/admin\/editions$/)
    expect((await context.request.get(`/api/v1/editions/${edition.id}`)).status()).toBe(STATUS_NOT_FOUND)
  })
})
