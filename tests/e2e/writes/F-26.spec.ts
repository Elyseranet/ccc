import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createFinalValidatedEdition, selectAdminEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-26 : admin, clôture de l'édition (écritures sur des éditions créées par le test, jamais 2026)
 *
 * @description
 * Chaque test crée SON édition par l'API réelle (`createFinalValidatedEdition` : 2 poules de 2 jouées, un qualifié par poule, finale tirée puis
 * jouée ou non) ; la clôture passe par l'écran, avec le code de l'édition à saisir (décision du 2026-11-05).
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const PAGE = '/admin/phase-finale/cloture'

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => `${node.target.join(' ')} :: ${node.html.slice(0, 260)}`).join(', ')}`)
}

const openClosing = async (page: Page) => {
  await page.goto(PAGE)
  await hydrated(page)
}

test.describe('admin clôture : écritures sur une édition créée par le test', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('finale non validée : message avec le lien vers les scores de la finale, bouton inactif avec sa raison, pas d’aperçu, 0 violation axe', async ({ page, context }) => {
    const edition = await createFinalValidatedEdition(context.request, 'f26 finale non validee', false)
    await selectAdminEdition(context, edition)
    await openClosing(page)
    await expect(page.getByTestId('page-title')).toHaveText('Clôture')
    await expect(page.getByTestId('closing-state-blocked')).toBeVisible()
    await expect(page.getByTestId('closing-state-blocked-link')).toHaveAttribute('href', '/admin/matchs?tour=FINAL')
    await expect(page.getByTestId('closing-open')).toBeDisabled()
    await expect(page.getByTestId('closing-why')).toContainText('la finale doit d’abord être validée')
    await expect(page.getByTestId('closing-preview')).toHaveCount(0)
    expect(await violationsOf(page)).toEqual([])
  })

  test('finale validée : champion·ne, finaliste, aperçu des points calculé par la fonction partagée, 0 violation axe', async ({ page, context }) => {
    const edition = await createFinalValidatedEdition(context.request, 'f26 apercu')
    await selectAdminEdition(context, edition)
    await openClosing(page)
    await expect(page.getByTestId('closing-state-blocked')).toHaveCount(0)
    await expect(page.getByTestId('closing-open')).toBeEnabled()
    await expect(page.getByTestId('closing-facts')).toContainText('4')
    await expect(page.getByTestId('closing-preview')).toContainText('Aperçu des points pour 4 participants')
    await expect(page.getByTestId('closing-preview')).toContainText('18 × 4 / 50 = 1,44')
    expect(await violationsOf(page)).toEqual([])
  })

  test('confirmation par le code : le bouton reste inactif tant que le code n’est pas saisi, Échap annule sans rien écrire, puis la clôture fige l’édition', async ({ page, context }) => {
    const edition = await createFinalValidatedEdition(context.request, 'f26 cloture')
    await selectAdminEdition(context, edition)
    await openClosing(page)
    await page.getByTestId('closing-open').click()
    const dialog = page.getByTestId('closing-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('définitive')
    await expect(page.getByTestId('closing-code').locator('input')).toBeFocused()
    await expect(page.getByTestId('closing-confirm')).toBeDisabled()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    expect((await (await context.request.get(`/api/v1/editions/${edition.id}`)).json() as { status: string }).status).toBe('PLAYOFFS')
    await page.getByTestId('closing-open').click()
    await page.getByTestId('closing-code').locator('input').fill('0000')
    await expect(page.getByTestId('closing-confirm')).toBeDisabled()
    await page.getByTestId('closing-code').locator('input').fill(edition.code)
    await expect(page.getByTestId('closing-confirm')).toBeEnabled()
    await page.getByTestId('closing-confirm').click()
    await expect(page.getByTestId('closing-state-success')).toBeVisible()
    await expect(page.getByTestId('closing-state-success')).toContainText(`Édition ${edition.year} clôturée.`)
    await expect(page.getByTestId('closing-open')).toHaveCount(0)
    const closed = await (await context.request.get(`/api/v1/editions/${edition.id}`)).json() as { status: string, participants: Array<{ finalStage: string | null, points: number | null }> }
    expect(closed.status).toBe('CLOSED')
    expect(closed.participants.filter(participant => participant.finalStage === 'CHAMPION')).toHaveLength(1)
    expect(closed.participants.every(participant => participant.points !== null)).toBe(true)
  })

  test('édition clôturée : alerte « Édition clôturée » avec le lien vers le palmarès, aucun bouton, la clôture est idempotente, 0 violation axe', async ({ page, context }) => {
    const edition = await createFinalValidatedEdition(context.request, 'f26 deja cloturee')
    expect((await context.request.post(`/api/v1/editions/${edition.id}/cloture`)).status()).toBe(200)
    expect((await context.request.post(`/api/v1/editions/${edition.id}/cloture`)).status()).toBe(200)
    await selectAdminEdition(context, edition)
    await openClosing(page)
    await expect(page.getByTestId('closing-state-closed')).toBeVisible()
    await expect(page.getByTestId('closing-state-closed-link')).toHaveAttribute('href', '/palmares')
    await expect(page.getByTestId('closing-state-closed')).toContainText(/Clôturée le \d{2}\/\d{2} à \d{2}:\d{2}\. Points figés\./)
    await expect(page.getByTestId('closing-open')).toHaveCount(0)
    expect(await violationsOf(page)).toEqual([])
  })

  test('archive clôturée sans date (closedAt nul, B-22) : « Date de clôture non archivée. Points figés. », aucun bouton', async ({ page, context }) => {
    const list = await (await context.request.get('/api/v1/editions')).json() as Array<{ id: string, code: string, year: number, status: string }>
    const archive = list.find(item => item.status === 'CLOSED')
    expect(archive).toBeDefined()
    const detail = await (await context.request.get(`/api/v1/editions/${archive!.id}`)).json() as { closedAt: string | null }
    expect(detail.closedAt).toBeNull()
    await selectAdminEdition(context, archive!)
    await openClosing(page)
    await expect(page.getByTestId('closing-state-closed')).toBeVisible()
    await expect(page.getByTestId('closing-state-closed')).toContainText('Date de clôture non archivée. Points figés.')
    await expect(page.getByTestId('closing-state-closed')).not.toContainText('Clôturée le')
    await expect(page.getByTestId('closing-open')).toHaveCount(0)
  })

  test('409 « finale non validée » renvoyé par le serveur : message d’erreur annoncé avec « Vérifier l’état »', async ({ page, context }) => {
    const edition = await createFinalValidatedEdition(context.request, 'f26 erreur 409')
    await selectAdminEdition(context, edition)
    await openClosing(page)
    await page.route('**/api/v1/editions/*/cloture', route => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ statusCode: 409, code: 'FINAL_NOT_VALIDATED', message: 'x' }) }))
    await page.getByTestId('closing-open').click()
    await page.getByTestId('closing-code').locator('input').fill(edition.code)
    await page.getByTestId('closing-confirm').click()
    await expect(page.getByTestId('closing-failure')).toBeVisible()
    await expect(page.getByTestId('closing-failure')).toContainText('La finale n’est pas validée.')
    await expect(page.getByTestId('closing-verify')).toBeVisible()
    expect((await (await context.request.get(`/api/v1/editions/${edition.id}`)).json() as { status: string }).status).toBe('PLAYOFFS')
    expect(await violationsOf(page)).toEqual([])
  })
})
