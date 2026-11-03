import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { attachParticipant, createCompetitor, createRegistrationEdition, readCapturedMails, selectAdminEdition, uniqueEmail } from '../helpers/edition-write'
import type { IWriteEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-09 : admin, participants, parcours d'ÉCRITURE (QA-3)
 *
 * @description
 * Chaque test crée sa propre édition en inscriptions et ses propres compétiteurs par l'API réelle (aucune archive, ni
 * 2026, n'est touchée), choisit cette édition dans le sélecteur de l'admin, puis passe par l'écran. Les courriels
 * d'invitation sont capturés par le serveur de test (`invitationSent: true` ; `false` suppose un SMTP injoignable, couvert
 * par les tests de composant). Les parcours qui ne modifient rien (liste, recherche, 409 sur 2026) sont dans
 * `a11y/F-09.spec.ts`.
 ********************************************************/
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

const openParticipants = async (page: Page) => {
  await page.goto('/admin/participants')
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('page-title')).toBeVisible()
  await expect(page.getByTestId('participant-summary')).toContainText('inscrit')
}

const searchField = (page: Page) => page.getByTestId('participant-search').locator('input')

const adminParticipants = async (page: Page, edition: IWriteEdition) =>
  (await (await page.request.get(`/api/v1/admin/editions/${edition.id}/participants`)).json()) as Array<{ participationId: string, competitor: { id: string, displayName: string, avatarUrl: string | null }, account: { state: string } | null }>

const feedback = (page: Page) => page.getByTestId('participant-feedback')

test.describe('admin participants : écritures sur une édition créée par le test', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('rattacher un profil existant : aucun compte recréé, aucune invitation (invitationSent null)', async ({ page, context }) => {
    const { edition } = await createRegistrationEdition(context.request, 'rattacher')
    const profile = await createCompetitor(context.request, 'rattacher profil', { lastName: 'Rattachable Unique' })
    const mailsBefore = readCapturedMails().length
    await selectAdminEdition(context, edition)
    await openParticipants(page)

    await searchField(page).fill('Rattachable Unique')
    const suggestion = page.getByTestId('participant-search-profile').filter({ hasText: profile.displayName })
    await expect(suggestion).toBeVisible()
    await suggestion.click()

    await expect(feedback(page)).toContainText(`Profil rattaché à l’édition ${edition.year}`)
    await expect(page.getByTestId('participant-table')).toContainText(profile.displayName)
    const rows = await adminParticipants(page, edition)
    expect(rows.filter(row => row.competitor.id === profile.id)).toHaveLength(1)
    expect(readCapturedMails()).toHaveLength(mailsBefore)
  })

  test('créer un participant : invitation envoyée (invitationSent true), courriel capturé, compte invité', async ({ page, context }) => {
    const { edition } = await createRegistrationEdition(context.request, 'creer')
    await selectAdminEdition(context, edition)
    await openParticipants(page)
    const email = uniqueEmail('nouveau')

    await searchField(page).fill('Nouveau Inconnu')
    await page.getByTestId('participant-search-create').click()
    await page.getByTestId('participant-form-last-name').locator('input').fill('Nouveau Inconnu')
    await page.getByTestId('participant-form-first-name').locator('input').fill('Camille')
    await page.getByTestId('participant-form-nickname').locator('input').fill('Décapsuleur')
    await page.getByTestId('participant-form-email').locator('input').fill(email)
    await page.getByTestId('participant-form-submit').click()

    await expect(feedback(page)).toContainText('Invitation envoyée')
    await expect(page.getByTestId('participant-form')).toHaveCount(0)
    await expect(page.getByTestId('participant-table')).toContainText('Camille Nouveau Inconnu')
    await expect(page.getByTestId('participant-account-INVITED').first()).toBeVisible()
    expect(readCapturedMails().some(mail => mail.to === email)).toBe(true)
    const created = (await adminParticipants(page, edition)).find(row => row.competitor.displayName === 'Camille Nouveau Inconnu')
    expect(created?.account?.state).toBe('INVITED')
  })

  test('retirer un inscrit avant le tirage', async ({ page, context }) => {
    const { edition, seed } = await createRegistrationEdition(context.request, 'retirer')
    await selectAdminEdition(context, edition)
    await openParticipants(page)
    await expect(page.getByTestId('participant-table')).toContainText(seed.displayName)

    await page.getByRole('button', { name: `Retirer ${seed.displayName}` }).click()

    await expect(feedback(page)).toContainText('Participant retiré de l’édition')
    await expect(page.getByTestId('participant-table')).toHaveCount(0)
    expect((await adminParticipants(page, edition)).some(row => row.competitor.id === seed.id)).toBe(false)
  })

  test('email déjà pris : refus 409, message sur le champ, rien n’est créé', async ({ page, context }) => {
    const { edition, seed } = await createRegistrationEdition(context.request, 'email-pris')
    await selectAdminEdition(context, edition)
    await openParticipants(page)
    const before = (await adminParticipants(page, edition)).length

    await searchField(page).fill('Doublon Email')
    await page.getByTestId('participant-search-create').click()
    await page.getByTestId('participant-form-last-name').locator('input').fill('Doublon Email')
    await page.getByTestId('participant-form-first-name').locator('input').fill('Autre')
    await page.getByTestId('participant-form-email').locator('input').fill(seed.email)
    await page.getByTestId('participant-form-submit').click()

    await expect(page.getByTestId('participant-form-email-taken')).toContainText('déjà rattaché à un autre compte')
    await expect(page.getByTestId('participant-form')).toBeVisible()
    expect((await adminParticipants(page, edition)).length).toBe(before)
  })

  test('homonymes proches (parcours.md 4b.4) : « Remi » retrouve « Rémi », un profil déjà inscrit n’est pas proposé, « Créer » reste toujours offert', async ({ page, context }) => {
    const { edition, seed } = await createRegistrationEdition(context.request, 'homonymes')
    const accent = await createCompetitor(context.request, 'homonyme accent', { firstName: 'Rémi', lastName: 'Homonyme Quasi' })
    const plain = await createCompetitor(context.request, 'homonyme plain', { firstName: 'Remi', lastName: 'Homonyme Quasi' })
    await attachParticipant(context.request, edition, plain)
    await selectAdminEdition(context, edition)
    await openParticipants(page)

    await searchField(page).fill('Remi Homonyme Quasi')
    const profiles = page.getByTestId('participant-search-profile')
    await expect(profiles.filter({ hasText: accent.displayName })).toBeVisible()
    await expect(profiles.filter({ hasText: plain.displayName })).toHaveCount(0)
    await expect(profiles.filter({ hasText: seed.displayName })).toHaveCount(0)
    await expect(page.getByTestId('participant-search-create')).toBeVisible()
  })

  test('photo envoyée en second appel sur un compétiteur créé par le test', async ({ page, context }) => {
    const { edition } = await createRegistrationEdition(context.request, 'avatar')
    await selectAdminEdition(context, edition)
    await openParticipants(page)

    await searchField(page).fill('Avatar Unique')
    await page.getByTestId('participant-search-create').click()
    await page.getByTestId('participant-form-last-name').locator('input').fill('Avatar Unique')
    await page.getByTestId('participant-form-first-name').locator('input').fill('Photo')
    await page.getByTestId('participant-form-email').locator('input').fill(uniqueEmail('avatar'))
    await page.getByTestId('participant-form-avatar').locator('input[type="file"]').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: PNG_1X1 })
    await page.getByTestId('participant-form-submit').click()

    await expect(feedback(page)).toContainText('Invitation envoyée')
    await expect(page.getByTestId('participant-avatar-pending')).toHaveCount(0)
    const created = (await adminParticipants(page, edition)).find(row => row.competitor.displayName === 'Photo Avatar Unique')
    expect(created?.competitor.avatarUrl).toMatch(/^\/api\/v1\/competiteurs\/.+\/avatar\?v=/)
    const image = await page.request.get(created!.competitor.avatarUrl!)
    expect(image.status()).toBe(200)
    expect(image.headers()['content-type']).toMatch(/^image\//)
  })

  test('recherche sans résultat : « Aucun profil ne correspond. », seule la création est proposée ; formulaire ouvert : 0 violation axe, champs privés annoncés', async ({ page, context }) => {
    const { edition } = await createRegistrationEdition(context.request, 'formulaire')
    await selectAdminEdition(context, edition)
    await openParticipants(page)

    await searchField(page).fill('zzqxjvw introuvable')
    await expect(page.getByTestId('participant-search-profile')).toHaveCount(0)
    await page.getByTestId('participant-search-create').click()
    await expect(page.getByTestId('participant-form')).toBeVisible()
    await expect(page.getByLabel('Email · privé')).toBeVisible()
    await expect(page.getByLabel('Téléphone · privé')).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(results.violations.map(violation => violation.id)).toEqual([])
  })
})
