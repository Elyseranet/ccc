import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { attachNewParticipants, createCompetitor, createRegistrationEdition, createValidatedPoolDraw, selectAdminEdition } from '../helpers/edition-write'
import type { IWriteEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-09 : refus 409 après la validation du tirage (Q1, Q2), sur une édition créée par le test (QA-3)
 *
 * @description
 * La page est ouverte AVANT la validation : l'écran croit l'édition encore en inscriptions et propose les actions. Le tirage est ensuite créé et
 * validé par les routes réelles de B-11 (helper partagé `createValidatedPoolDraw`) ; l'action tentée reçoit 409 `REGISTRATION_CLOSED`, dont le message
 * est affiché, puis l'écran apprend l'état de l'édition (rechargée) et masque les actions. Une page ouverte APRÈS la validation connaît
 * déjà l'état : lecture seule d'emblée.
 ********************************************************/
const openParticipants = async (page: Page) => {
  await page.goto('/admin/participants')
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('page-title')).toBeVisible()
}

const searchField = (page: Page) => page.getByTestId('participant-search').locator('input')

const participantsOf = async (page: Page, edition: IWriteEdition) =>
  (await (await page.request.get(`/api/v1/admin/editions/${edition.id}/participants`)).json()) as Array<{ participationId: string, competitor: { id: string } }>

test.describe('admin participants : refus après la validation du tirage', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('retrait refusé (409 REGISTRATION_CLOSED) : message traduit, puis état connu, boutons Retirer masqués, inscrits inchangés', async ({ page, context }) => {
    const { edition, seed } = await createRegistrationEdition(context.request, 'tirage retrait')
    await attachNewParticipants(context.request, edition, 3, 'tirage retrait')
    await selectAdminEdition(context, edition)
    await openParticipants(page)
    await expect(page.getByTestId('participant-remove')).toHaveCount(4)
    const before = await participantsOf(page, edition)

    await createValidatedPoolDraw(context.request, edition)
    await page.getByRole('button', { name: `Retirer ${seed.displayName}` }).click()

    await expect(page.getByRole('status').filter({ hasText: 'Les inscriptions sont closes' })).toBeVisible()
    await expect(page.getByTestId('participant-read-only')).toBeVisible()
    await expect(page.getByTestId('participant-remove')).toHaveCount(0)
    await expect(page.getByTestId('participant-search').locator('input')).toBeDisabled()
    expect(await participantsOf(page, edition)).toHaveLength(before.length)
  })

  test('ajout refusé (409 REGISTRATION_CLOSED) : message traduit, puis état connu, recherche désactivée, aucun inscrit de plus', async ({ page, context }) => {
    const { edition } = await createRegistrationEdition(context.request, 'tirage ajout')
    await attachNewParticipants(context.request, edition, 3, 'tirage ajout')
    const latecomer = await createCompetitor(context.request, 'tirage ajout retardataire', { lastName: 'Retardataire Unique' })
    await selectAdminEdition(context, edition)
    await openParticipants(page)
    const before = await participantsOf(page, edition)

    await searchField(page).fill('Retardataire Unique')
    const option = page.getByTestId('participant-search-profile').filter({ hasText: latecomer.displayName })
    await expect(option).toBeVisible()
    await createValidatedPoolDraw(context.request, edition)
    await option.click()

    await expect(page.getByRole('status').filter({ hasText: 'Les inscriptions sont closes' })).toBeVisible()
    await expect(page.getByTestId('participant-read-only')).toBeVisible()
    await expect(searchField(page)).toBeDisabled()
    const after = await participantsOf(page, edition)
    expect(after).toHaveLength(before.length)
    expect(after.some(row => row.competitor.id === latecomer.id)).toBe(false)
  })

  test('page ouverte après la validation : état connu d’emblée, lecture seule, aucun bouton Retirer', async ({ page, context }) => {
    const { edition } = await createRegistrationEdition(context.request, 'tirage connu')
    await attachNewParticipants(context.request, edition, 3, 'tirage connu')
    await createValidatedPoolDraw(context.request, edition)
    await selectAdminEdition(context, edition)
    await openParticipants(page)

    await expect(page.getByTestId('participant-read-only')).toBeVisible()
    await expect(page.getByTestId('participant-remove')).toHaveCount(0)
    await expect(searchField(page)).toBeDisabled()
    await expect(page.getByTestId('participant-summary')).toContainText('inscriptions closes')
    await expect(page.getByTestId('participant-table')).toBeVisible()
  })
})
