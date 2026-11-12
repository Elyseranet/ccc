import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createCompetitor, createEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-13 : admin, éditions et compétiteurs, parcours d'ÉCRITURE (QA-3)
 *
 * @description
 * Chaque test crée sa propre édition ou son propre compétiteur par l'API réelle (aucune archive, ni 2026, n'est touchée) puis
 * passe par l'écran. Le contrôle de version (T-SEC-10) est vérifié de bout en bout : la fiche porte `version`, l'écran envoie
 * `If-Match`, une modification faite entre-temps donne 412 et l'écran recharge. La photo est un second appel qui ne fait pas avancer
 * la version. Les lectures et l'accessibilité sont dans `a11y/F-13.spec.ts`.
 ********************************************************/
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const STATUS_PRECONDITION_FAILED = 412
const STATUS_OK = 200
const YEAR_FIRST_UI = 2090
const YEAR_SPAN_UI = 10

interface IEditionRow { id: string, code: string, year: number, name: string | null, location: string | null, description: string | null }
interface ICompetitorRow { id: string, displayName: string, firstName: string | null, lastName: string | null, nickname: string | null, avatarUrl: string | null, version: number }

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('page-title')).toBeVisible()
}

const editions = async (page: Page): Promise<IEditionRow[]> => await (await page.request.get('/api/v1/editions')).json() as IEditionRow[]
const competitor = async (page: Page, id: string): Promise<ICompetitorRow> => await (await page.request.get(`/api/v1/competiteurs/${id}`)).json() as ICompetitorRow
const field = (page: Page, testId: string) => page.getByTestId(testId).locator('input')

test.describe('admin éditions : écritures sur une édition créée par le test', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('créer une édition : le code est généré par le serveur, affiché, et jamais saisi', async ({ page }) => {
    const year = YEAR_FIRST_UI + (test.info().workerIndex % YEAR_SPAN_UI)
    await page.goto('/admin/editions/nouvelle')
    await hydrated(page)
    await expect(page.getByTestId('edition-form-code')).toHaveCount(0)
    await expect(page.getByTestId('edition-form-code-info')).toContainText('le serveur le génère')

    await field(page, 'edition-form-year').fill(String(year))
    await field(page, 'edition-form-name').fill(`E2E création ${year}`)
    await field(page, 'edition-form-location').fill('Bar des tests')
    await page.getByTestId('edition-form-submit').click()

    await expect(page.getByTestId('edition-created')).toBeVisible()
    const shown = (await page.getByTestId('edition-created-title').innerText()).replace('Code attribué :', '').trim()
    expect(shown).toMatch(new RegExp(`^${year}[b-z]?$`))
    const created = (await editions(page)).find(edition => edition.code === shown)
    expect(created?.year).toBe(year)
    expect(created?.name).toBe(`E2E création ${year}`)
    await expect(page.getByTestId('edition-created-address')).toHaveText(`/editions/${shown}`)
  })

  test('année « 27 » : refus sur place, message sous le champ, rien n’est créé', async ({ page }) => {
    await page.goto('/admin/editions/nouvelle')
    await hydrated(page)
    await field(page, 'edition-form-year').fill('27')
    await field(page, 'edition-form-name').fill('Année trop courte')
    await page.getByTestId('edition-form-submit').click()

    await expect(page.getByTestId('edition-form-year')).toContainText('année sur 4 chiffres')
    await expect(field(page, 'edition-form-year')).toHaveValue('27')
    await expect(page.getByTestId('edition-created')).toHaveCount(0)
    // Les autres tests créent des éditions en parallèle : on cherche le nom de celle-ci plutôt que de compter.
    expect((await editions(page)).filter(edition => edition.name === 'Année trop courte')).toHaveLength(0)
  })

  test('modifier une édition : snackbar de confirmation qui disparaît, valeurs enregistrées, code et année inchangés', async ({ page, context }) => {
    const edition = await createEdition(context.request, 'modifier')
    await page.goto(`/admin/editions/${edition.code}`)
    await hydrated(page)
    await expect(page.getByTestId('edition-readonly-code')).toContainText(edition.code)
    await expect(page.getByTestId('edition-form-year')).toHaveCount(0)

    await field(page, 'edition-form-name').fill('Nom modifié par le test')
    await field(page, 'edition-form-location').fill('Lyon')
    await page.getByTestId('edition-form-submit').click()

    const snackbar = page.getByTestId('edition-form-saved')
    await expect(snackbar).toContainText('Modifications enregistrées')
    await expect(snackbar.locator('[role="status"]').first()).toBeVisible()
    await expect(snackbar).toBeHidden({ timeout: 8000 })
    const saved = (await editions(page)).find(row => row.id === edition.id)
    expect(saved?.name).toBe('Nom modifié par le test')
    expect(saved?.location).toBe('Lyon')
    expect(saved?.code).toBe(edition.code)
    expect(saved?.year).toBe(edition.year)
  })

  test('la liste propose Modifier pour une édition ouverte et la retrouve par son code', async ({ page, context }) => {
    const edition = await createEdition(context.request, 'liste')
    await page.goto('/admin/editions')
    await hydrated(page)
    await page.getByTestId('editions-search').locator('input').fill(edition.code)
    await expect(page.getByTestId(`editions-action-${edition.code}`)).toHaveText('Modifier')
    await page.getByTestId(`editions-action-${edition.code}`).click()
    await expect(page).toHaveURL(new RegExp(`/admin/editions/${edition.code}$`))
  })
})

test.describe('admin compétiteurs : identité (If-Match) et photo sur un profil créé par le test', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('corriger l’identité : valeurs enregistrées, version avancée, champ vidé effacé', async ({ page, context }) => {
    const profile = await createCompetitor(context.request, 'identite', { firstName: 'Lou', lastName: 'Identite Unique' })
    const before = await competitor(page, profile.id)
    await page.goto(`/admin/competiteurs/${profile.id}`)
    await hydrated(page)
    await expect(page.getByTestId('competitor-form-title')).toHaveText(profile.displayName)

    await field(page, 'competitor-form-display-name').fill('Lou Corrigé')
    await field(page, 'competitor-form-nickname').fill('La Mousse')
    await field(page, 'competitor-form-first-name').fill('')
    await page.getByTestId('competitor-form-submit').click()

    await expect(page.getByTestId('competitor-form-title')).toHaveText('Lou Corrigé')
    const after = await competitor(page, profile.id)
    expect(after.displayName).toBe('Lou Corrigé')
    expect(after.nickname).toBe('La Mousse')
    expect(after.firstName).toBeNull()
    expect(after.version).toBeGreaterThan(before.version)
  })

  test('version périmée (412) : message, fiche rechargée avec les valeurs actuelles, rien d’écrasé', async ({ page, context }) => {
    const profile = await createCompetitor(context.request, 'conflit', { firstName: 'Conflit', lastName: 'Version Unique' })
    await page.goto(`/admin/competiteurs/${profile.id}`)
    await hydrated(page)
    const seen = await competitor(page, profile.id)

    const concurrent = await page.request.patch(`/api/v1/competiteurs/${profile.id}`, {
      data: { nickname: 'Autre admin' },
      headers: { 'if-match': `"${seen.version}"` }
    })
    expect(concurrent.status()).toBe(STATUS_OK)

    await field(page, 'competitor-form-nickname').fill('Mon pseudo')
    await page.getByTestId('competitor-form-submit').click()

    await expect(page.getByTestId('competitor-form-error')).toContainText('Ce compétiteur a été modifié, rechargez.')
    await expect(field(page, 'competitor-form-nickname')).toHaveValue('Autre admin')
    expect((await competitor(page, profile.id)).nickname).toBe('Autre admin')
  })

  test('le serveur refuse un PATCH sans If-Match (428) : le contrôle est bien obligatoire', async ({ page, context }) => {
    const profile = await createCompetitor(context.request, 'sans-if-match')
    const response = await page.request.patch(`/api/v1/competiteurs/${profile.id}`, { data: { nickname: 'Sans en-tête' } })
    expect(response.status()).toBe(428)
    const stale = await page.request.patch(`/api/v1/competiteurs/${profile.id}`, { data: { nickname: 'Périmée' }, headers: { 'if-match': '"9999"' } })
    expect(stale.status()).toBe(STATUS_PRECONDITION_FAILED)
  })

  test('photo : envoi puis retrait en second appel, sans faire avancer la version de l’identité', async ({ page, context }) => {
    const profile = await createCompetitor(context.request, 'photo', { firstName: 'Photo', lastName: 'Unique Avatar' })
    const before = await competitor(page, profile.id)
    await page.goto(`/admin/competiteurs/${profile.id}`)
    await hydrated(page)
    await expect(page.getByTestId('competitor-photo-remove')).toBeDisabled()

    await page.getByTestId('competitor-photo-input').locator('input[type="file"]').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: PNG_1X1 })
    await expect(page.getByTestId('competitor-photo-remove')).toBeEnabled()
    const withPhoto = await competitor(page, profile.id)
    expect(withPhoto.avatarUrl).not.toBeNull()
    expect(withPhoto.version).toBe(before.version)

    await field(page, 'competitor-form-nickname').fill('Avec photo')
    await page.getByTestId('competitor-form-submit').click()
    await expect(page.getByTestId('competitor-form-error')).toHaveCount(0)
    expect((await competitor(page, profile.id)).nickname).toBe('Avec photo')

    await page.getByTestId('competitor-photo-remove').click()
    await expect.poll(async () => (await competitor(page, profile.id)).avatarUrl).toBeNull()
    await expect(page.getByTestId('competitor-photo-remove')).toBeDisabled()
  })

  test('fichier d’un format refusé (415) : message dans l’alerte de la photo, rien n’est posé', async ({ page, context }) => {
    const profile = await createCompetitor(context.request, 'photo-refusee')
    await page.goto(`/admin/competiteurs/${profile.id}`)
    await hydrated(page)
    await page.getByTestId('competitor-photo-input').locator('input[type="file"]').setInputFiles({ name: 'faux.png', mimeType: 'image/png', buffer: Buffer.from('pas une image') })
    await expect(page.getByTestId('competitor-photo-error')).toBeVisible()
    expect((await competitor(page, profile.id)).avatarUrl).toBeNull()
  })
})
