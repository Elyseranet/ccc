import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { selectAdminEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-09 : admin, participants, lectures et refus (aucune écriture)
 *
 * @description
 * Données réelles de la base de test : 2026 en phase de poules (tirage validé, QA-2, T-QA-03) et les archives clôturées.
 * Rien n'est modifié : l'ajout et le retrait sur 2026 sont refusés par le serveur (409 `REGISTRATION_CLOSED`), le
 * refus est vérifié par l'écran. Les parcours qui écrivent sont dans `writes/F-09.spec.ts`, sur une édition créée par le test.
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

interface IEditionRow { id: string, code: string, status: string }
interface IAdminRow { participationId: string, competitor: { id: string, displayName: string } }

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
}

const openParticipants = async (page: Page) => {
  await page.goto('/admin/participants')
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('page-title')).toBeVisible()
}

const editionOf = async (page: Page, code: string): Promise<IEditionRow> => {
  const editions = await (await page.request.get('/api/v1/editions')).json() as IEditionRow[]
  return editions.find(edition => edition.code === code)!
}

const registered = async (page: Page, editionId: string): Promise<IAdminRow[]> =>
  await (await page.request.get(`/api/v1/admin/editions/${editionId}/participants`)).json() as IAdminRow[]

const unregisteredProfile = async (page: Page, registeredIds: ReadonlySet<string>): Promise<{ id: string, displayName: string }> => {
  const list = await (await page.request.get('/api/v1/competiteurs?pageSize=100')).json() as { items: Array<{ id: string, displayName: string }> }
  return list.items.find(item => !registeredIds.has(item.id))!
}

test.describe('admin participants : lecture, états et refus sur les vraies données', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('édition 2026 : liste des inscrits, un seul h1, table nommée, aucune donnée privée, 0 violation axe', async ({ page }) => {
    const edition = await editionOf(page, '2026')
    const rows = await registered(page, edition.id)
    await openParticipants(page)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByTestId('participant-summary')).toContainText(`${rows.length} inscrits`)
    await expect(page.getByTestId('participant-count')).toHaveText(String(rows.length))
    await expect(page.getByTestId('participant-table').locator('tbody tr')).toHaveCount(8)
    await expect(page.getByTestId('participant-table').locator('caption')).toHaveCount(1)
    await expect(page.getByTestId('participant-pagination').getByTestId('pagination-range')).toHaveText(`1–8 sur ${rows.length}`)
    const html = await page.getByTestId('admin-participants').innerHTML()
    expect(html).not.toMatch(/@|\b0\d[ .]?\d\d[ .]?\d\d\b/)
    expect(await violationsOf(page)).toEqual([])
  })

  test('édition 2026 (au-delà de l’inscription) : lecture seule, aucun bouton Retirer, recherche désactivée, 0 violation axe', async ({ page }) => {
    await openParticipants(page)
    await expect(page.getByTestId('participant-read-only')).toContainText('Les inscriptions sont closes')
    await expect(page.getByTestId('participant-remove')).toHaveCount(0)
    await expect(page.getByTestId('participant-search').locator('input')).toBeDisabled()
    await expect(page.getByTestId('participant-summary')).toContainText('inscriptions closes')
    expect(await violationsOf(page)).toEqual([])
  })

  test('le serveur refuse l’ajout et le retrait sur 2026 (409 REGISTRATION_CLOSED) et sur une archive (409 EDITION_CLOSED), sans rien modifier', async ({ page }) => {
    const edition = await editionOf(page, '2026')
    const archive = await editionOf(page, '2025')
    const before = await registered(page, edition.id)
    const profile = await unregisteredProfile(page, new Set(before.map(row => row.competitor.id)))
    const add = await page.request.post(`/api/v1/editions/${edition.id}/participants`, { data: { competitorId: profile.id } })
    expect(add.status()).toBe(409)
    expect((await add.json()).code).toBe('REGISTRATION_CLOSED')
    const remove = await page.request.delete(`/api/v1/editions/${edition.id}/participants/${before[0]!.participationId}`)
    expect(remove.status()).toBe(409)
    expect((await remove.json()).code).toBe('REGISTRATION_CLOSED')
    const addArchive = await page.request.post(`/api/v1/editions/${archive.id}/participants`, { data: { competitorId: profile.id } })
    expect(addArchive.status()).toBe(409)
    expect((await addArchive.json()).code).toBe('EDITION_CLOSED')
    expect(await registered(page, edition.id)).toHaveLength(before.length)
  })

  test('édition clôturée : lecture seule, aucun bouton Retirer, recherche désactivée', async ({ page, context }) => {
    const edition = await editionOf(page, '2025')
    await selectAdminEdition(context, { id: edition.id, code: edition.code, year: 2025, status: edition.status })
    await openParticipants(page)
    await expect(page.getByTestId('participant-read-only')).toBeVisible()
    await expect(page.getByTestId('participant-remove')).toHaveCount(0)
    await expect(page.getByTestId('participant-search').locator('input')).toBeDisabled()
    await expect(page.getByTestId('participant-summary')).toContainText('lecture seule')
    expect(await violationsOf(page)).toEqual([])
  })

  test('erreur de chargement de la liste (navigation côté client) : alerte et nouvelle tentative', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
    let calls = 0
    await page.route('**/api/v1/admin/editions/*/participants', async (route) => {
      calls += 1
      if (calls === 1) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal error' }) })
      } else {
        await route.continue()
      }
    })
    await page.getByTestId('admin-nav-/admin/participants').click()
    await expect(page.getByTestId('participant-list-error')).toBeVisible()
    await page.getByTestId('participant-list-retry').click()
    await expect(page.getByTestId('participant-table')).toBeVisible()
  })
})
