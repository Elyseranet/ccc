import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'
import { API_ROUTES } from '../../../src/consts/api-routes.const'
import { API_ENDPOINT } from '../../../src/enums/api-endpoint.enum'
import { createCompetitor, readCapturedMails, uniqueEmail } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-68 : écran « Administrateurs » (inviter, promouvoir, corriger, renvoyer, retirer)
 *
 * @description
 * Les écritures sur `/admin/administrateurs` (B-31) sont en `test.fixme` tant que les routes portent un `pendingTicket` : chaque test se
 * réactive seul quand B-31 le retire de `API_ROUTES`. Chaque test invite ses propres comptes (email unique) : aucun test n'écrit sur un
 * compte partagé, et la base de test est remise à neuf à chaque lancement. « Renvoyer » (invitation expirée) n'est pas reproductible sans
 * horloge : couvert par le test de composant (`tests/nuxt/front/admin-administrators.test.ts`). Dernier administrateur actif (409
 * `LAST_ADMIN`) : la base de test porte plusieurs administrateurs actifs, le refus est couvert par les tests d'API de B-31.
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const PENDING = Array.from(new Set([API_ENDPOINT.ADMINS, API_ENDPOINT.ADMIN_INVITE, API_ENDPOINT.ADMIN_INVITATION_RESEND, API_ENDPOINT.ADMIN_EMAIL_UPDATE, API_ENDPOINT.ADMIN_REVOKE].flatMap(endpoint => API_ROUTES[endpoint].pendingTicket ?? [])))
const awaitingRoutes = () => test.fixme(PENDING.length > 0, `en attente de ${PENDING.join(', ')} : /admin/administrateurs`)
const STATUS_CREATED = 201
const STATUS_OK = 200
const STATUS_CONFLICT = 409

interface IAdminRow { id: string, email: string, isSelf: boolean }

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
}

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => `${node.target.join(' ')} :: ${node.html.slice(0, 200)}`).join(', ')}`)
}

const openPage = async (page: Page) => {
  await page.goto('/admin/administrateurs')
  await hydrated(page)
  await expect(page.getByTestId('administrator-list')).toBeVisible()
}

/** Invite un administrateur par l'API réelle, avant de charger l'écran. */
const inviteByApi = async (context: BrowserContext, email: string) => {
  const response = await context.request.post('/api/v1/admin/administrateurs', { data: { email } })
  expect(response.status()).toBe(STATUS_CREATED)
  return (await response.json() as { id: string }).id
}

const rowOf = (page: Page, email: string) => page.getByTestId('administrator-table').locator('tbody tr', { hasText: email })

test.describe('admin administrateurs', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('liste : « Vous » sans action sur sa propre ligne, pastille Actif, 0 violation axe', async ({ page }) => {
    awaitingRoutes()
    await openPage(page)
    const self = page.getByTestId('administrator-table').locator('tbody tr', { has: page.getByTestId('administrator-self') })
    await expect(self).toHaveCount(1)
    await expect(self.getByTestId('administrator-state-ACTIVE')).toHaveText('Actif')
    await expect(self.getByTestId('administrator-revoke')).toHaveCount(0)
    await expect(self.getByTestId('administrator-no-action')).toBeVisible()
    expect(await violationsOf(page)).toEqual([])
  })

  test('inviter : email invalide refusé sans appel ; invitation envoyée, courriel capturé, ligne « Invité », snackbar ; même email : refusé', async ({ page }) => {
    awaitingRoutes()
    const email = uniqueEmail('f68.invite')
    const calls: string[] = []
    page.on('request', request => request.method() === 'POST' && request.url().includes('/admin/administrateurs') && calls.push(request.url()))
    await openPage(page)
    await expect(page.getByLabel('Email · privé')).toHaveCount(1)
    await page.getByLabel('Email · privé').fill('pas-un-email')
    await page.getByTestId('administrator-invite-submit').click()
    await expect(page.getByTestId('administrator-invite')).toContainText('Adresse email invalide')
    expect(calls).toEqual([])
    await page.getByLabel('Email · privé').fill(email)
    await page.getByTestId('administrator-invite-submit').click()
    await expect(page.getByTestId('administrator-feedback')).toContainText(`Invitation envoyée à ${email}`)
    await expect(rowOf(page, email).getByTestId('administrator-state-INVITED')).toHaveText('Invité')
    await expect(page.getByLabel('Email · privé')).toHaveValue('')
    expect(readCapturedMails().some(mail => mail.to === email)).toBe(true)
    await page.getByLabel('Email · privé').fill(email)
    await page.getByTestId('administrator-invite-submit').click()
    await expect(page.getByTestId('administrator-invite-error')).toContainText('Email déjà utilisé.')
    await expect(page.getByLabel('Email · privé')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('administrator-invite')).toContainText('Cet email est déjà celui d’un administrateur.')
  })

  test('promouvoir : l’email d’un compte joueur le nomme administrateur, il garde sa fiche', async ({ page, context }) => {
    awaitingRoutes()
    const player = await createCompetitor(context.request, 'f68 promu')
    await openPage(page)
    await page.getByLabel('Email · privé').fill(player.email)
    await page.getByTestId('administrator-invite-submit').click()
    await expect(page.getByTestId('administrator-feedback')).toContainText('est maintenant administrateur')
    await expect(rowOf(page, player.email)).toContainText('Fiche joueur')
  })

  test('corriger : boîte à libellé visible, focus sur le champ, Échap rend le focus ; nouvel email, nouveau courriel, ancienne ligne remplacée', async ({ page, context }) => {
    awaitingRoutes()
    const first = uniqueEmail('f68.fix-a')
    const second = uniqueEmail('f68.fix-b')
    await inviteByApi(context, first)
    await openPage(page)
    const trigger = rowOf(page, first).getByTestId('administrator-fix')
    await trigger.click()
    const dialog = page.getByTestId('administrator-fix-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Corriger l’invitation')
    await expect(page.getByTestId('administrator-fix-email').locator('input')).toBeFocused()
    await expect(page.getByTestId('administrator-fix-email').locator('input')).toHaveValue(first)
    expect(await violationsOf(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await trigger.click()
    await page.getByTestId('administrator-fix-email').locator('input').fill(second)
    await page.getByTestId('administrator-fix-confirm').click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByTestId('administrator-feedback')).toContainText(`Invitation envoyée à ${second}`)
    await expect(rowOf(page, second)).toHaveCount(1)
    await expect(rowOf(page, first)).toHaveCount(0)
    expect(readCapturedMails().some(mail => mail.to === second)).toBe(true)
  })

  test('retirer un invité : confirmation dite, focus initial sur « Annuler », Échap annule ; confirmer annule l’invitation', async ({ page, context }) => {
    awaitingRoutes()
    const email = uniqueEmail('f68.revoke')
    await inviteByApi(context, email)
    await openPage(page)
    const trigger = rowOf(page, email).getByTestId('administrator-revoke')
    await trigger.click()
    const dialog = page.getByTestId('administrator-revoke-dialog')
    await expect(dialog).toContainText(`Retirer l’accès de ${email} ?`)
    await expect(dialog).toContainText('Cette invitation n’a jamais été activée : elle est annulée et le lien envoyé ne fonctionnera plus.')
    await expect(page.getByTestId('administrator-revoke-cancel')).toBeFocused()
    expect(await violationsOf(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await trigger.click()
    await page.getByTestId('administrator-revoke-confirm').click()
    await expect(page.getByTestId('administrator-feedback')).toContainText(`Invitation annulée pour ${email}`)
    await expect(rowOf(page, email)).toHaveCount(0)
  })

  test('retirer son propre accès : refusé par le serveur (409 CANNOT_REVOKE_SELF), le bouton n’existe pas sur sa ligne', async ({ page, context }) => {
    awaitingRoutes()
    const list = await (await context.request.get('/api/v1/admin/administrateurs')).json() as IAdminRow[]
    const self = list.find(row => row.isSelf)!
    const response = await context.request.delete(`/api/v1/admin/administrateurs/${self.id}`)
    expect(response.status()).toBe(STATUS_CONFLICT)
    expect((await response.json() as { code: string }).code).toBe('CANNOT_REVOKE_SELF')
    await openPage(page)
    await expect(page.getByTestId('administrator-table').locator('tbody tr', { hasText: self.email }).getByTestId('administrator-revoke')).toHaveCount(0)
  })

  test('un participant n’a pas accès à la liste (403)', async ({ context }) => {
    awaitingRoutes()
    await signIn(context, 'member')
    expect((await context.request.get('/api/v1/admin/administrateurs')).status()).not.toBe(STATUS_OK)
  })
})
