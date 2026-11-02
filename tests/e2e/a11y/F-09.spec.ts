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

  test('recherche : un profil existant est proposé avec « Profil existant », « Créer un nouveau participant » ferme la liste', async ({ page }) => {
    const edition = await editionOf(page, '2026')
    const ids = new Set((await registered(page, edition.id)).map(row => row.competitor.id))
    const profile = await unregisteredProfile(page, ids)
    await openParticipants(page)
    await page.getByTestId('participant-search').locator('input').fill(profile.displayName)
    const suggestion = page.getByTestId('participant-search-profile').filter({ hasText: profile.displayName })
    await expect(suggestion).toBeVisible()
    await expect(suggestion).toContainText('Profil existant')
    await expect(page.getByTestId('participant-search-create')).toContainText(`Créer un nouveau participant « ${profile.displayName} »`)
  })

  test('recherche sans résultat : message « Aucun profil ne correspond. » et seule la création est proposée', async ({ page }) => {
    await openParticipants(page)
    await page.getByTestId('participant-search').locator('input').fill('zzqxjvw introuvable')
    await expect(page.getByTestId('participant-search-profile')).toHaveCount(0)
    await expect(page.getByTestId('participant-search-create')).toBeVisible()
  })

  test('rattacher un profil à 2026 est refusé (409 REGISTRATION_CLOSED) : message affiché, liste inchangée', async ({ page }) => {
    const edition = await editionOf(page, '2026')
    const before = await registered(page, edition.id)
    const profile = await unregisteredProfile(page, new Set(before.map(row => row.competitor.id)))
    await openParticipants(page)
    await page.getByTestId('participant-search').locator('input').fill(profile.displayName)
    await page.getByTestId('participant-search-profile').filter({ hasText: profile.displayName }).click()
    await expect(page.getByTestId('participant-feedback')).toContainText('Les inscriptions sont closes')
    expect(await registered(page, edition.id)).toHaveLength(before.length)
  })

  test('retirer un inscrit de 2026 est refusé (409 REGISTRATION_CLOSED) : message affiché, liste inchangée', async ({ page }) => {
    const edition = await editionOf(page, '2026')
    const before = await registered(page, edition.id)
    await openParticipants(page)
    await page.getByTestId('participant-remove').first().click()
    await expect(page.getByTestId('participant-feedback')).toContainText('Les inscriptions sont closes')
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

  test('formulaire de création ouvert : 0 violation axe, champs nommés, email et téléphone annoncés comme privés', async ({ page }) => {
    await openParticipants(page)
    await page.getByTestId('participant-search').locator('input').fill('Formulaire Axe')
    await page.getByTestId('participant-search-create').click()
    await expect(page.getByTestId('participant-form')).toBeVisible()
    await expect(page.getByLabel('Email · privé')).toBeVisible()
    await expect(page.getByLabel('Téléphone · privé')).toBeVisible()
    await expect(page.getByLabel('Nom', { exact: true })).toHaveValue('Formulaire Axe')
    expect(await violationsOf(page)).toEqual([])
  })

  test('formulaire : champs obligatoires et email invalide bloquent l’envoi', async ({ page }) => {
    await openParticipants(page)
    await page.getByTestId('participant-search').locator('input').fill('Validation')
    await page.getByTestId('participant-search-create').click()
    await page.getByTestId('participant-form-email').locator('input').fill('pas-un-email')
    await page.getByTestId('participant-form-submit').click()
    await expect(page.getByTestId('participant-form')).toContainText('Champ obligatoire')
    await expect(page.getByTestId('participant-form')).toContainText('Adresse email invalide')
    await expect(page.getByTestId('participant-feedback')).toHaveCount(0)
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
