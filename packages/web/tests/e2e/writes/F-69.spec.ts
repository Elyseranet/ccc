import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { API_ROUTES } from '../../../src/consts/api-routes.const'
import { API_ENDPOINT } from '../../../src/enums/api-endpoint.enum'
import { uniqueEmail } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-69 : relier la fiche d'un compétiteur au compte d'un administrateur (bloc « Compte et invitation »)
 *
 * @description
 * Tout dépend de la liste `GET /admin/administrateurs` (B-31, `pendingTicket` dans `API_ROUTES`) et de l'extension de `PUT /competiteurs/{id}/compte`
 * (B-32, `linked`, 409 `ACCOUNT_ALREADY_LINKED`) : les tests sont en `test.fixme` tant que B-31 est en attente, et ceux qui écrivent le lien
 * restent en `fixme` tant que `B32_PENDING` est vrai (B-32 n'ajoute aucune route, `API_ROUTES` ne peut pas le dire : passer la constante à
 * `false` au merge de B-32). Un administrateur sans fiche s'obtient par `POST /admin/administrateurs` (B-31) ; les fiches sont des compétiteurs
 * d'archive sans compte (un différent par test).
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const LEGACY_EDITION_CODE = '2012a'
const B32_PENDING = true
const ADMINS_PENDING = API_ROUTES[API_ENDPOINT.ADMINS].pendingTicket
const awaitingList = () => test.fixme(Boolean(ADMINS_PENDING), `en attente de ${ADMINS_PENDING} : GET /admin/administrateurs`)
const awaitingLink = () => test.fixme(Boolean(ADMINS_PENDING) || B32_PENDING, 'en attente de B-31 et B-32 : liste des administrateurs et lien à la fiche')

interface IArchivePlayer { id: string, displayName: string }

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
}

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => `${node.target.join(' ')} :: ${node.html.slice(0, 200)}`).join(', ')}`)
}

const archivePlayerWithoutAccount = async (request: APIRequestContext, index: number): Promise<IArchivePlayer> => {
  const editions = await (await request.get('/api/v1/editions')).json() as Array<{ id: string, code: string }>
  const legacy = editions.find(edition => edition.code === LEGACY_EDITION_CODE)
  if (!legacy) {
    throw new Error(`Édition d'archive ${LEGACY_EDITION_CODE} introuvable`)
  }
  const rows = await (await request.get(`/api/v1/admin/editions/${legacy.id}/participants`)).json() as Array<{ competitor: IArchivePlayer, account: unknown }>
  const player = rows.filter(row => row.account === null)[index + 6]?.competitor
  if (!player) {
    throw new Error(`Pas de joueur d'archive sans compte n°${index}`)
  }
  return { id: player.id, displayName: player.displayName }
}

/** Invite un administrateur sans fiche (`POST /admin/administrateurs`, B-31) et rend son email. */
const inviteAdmin = async (request: APIRequestContext, prefix: string): Promise<string> => {
  const email = uniqueEmail(prefix)
  const response = await request.post('/api/v1/admin/administrateurs', { data: { email } })
  expect(response.status()).toBe(201)
  return email
}

const openCompetitor = async (page: Page, id: string) => {
  await page.goto(`/admin/competiteurs/${id}`)
  await hydrated(page)
  await expect(page.getByTestId('competitor-account')).toBeVisible()
}

test.describe('admin fiche compétiteur : relier à un administrateur', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('liste des administrateurs non livrée : le bloc F-62 reste entier, la boîte dit que la liste manque', async ({ page, context }) => {
    test.skip(!ADMINS_PENDING, 'B-31 livré : couvert par les tests suivants')
    const player = await archivePlayerWithoutAccount(context.request, 0)
    await openCompetitor(page, player.id)
    await expect(page.getByTestId('competitor-account-submit')).toBeVisible()
    await page.getByTestId('competitor-account-link-open').click()
    await expect(page.getByTestId('admin-link-unavailable')).toBeVisible()
    await expect(page.getByTestId('admin-link-confirm')).toBeDisabled()
  })

  test('une fiche sans compte : l’action ouvre la boîte (libellé visible, focus, Échap rend le focus), 0 violation axe', async ({ page, context }) => {
    awaitingList()
    await inviteAdmin(context.request, 'adm-open')
    const player = await archivePlayerWithoutAccount(context.request, 1)
    await openCompetitor(page, player.id)
    const trigger = page.getByTestId('competitor-account-link-open')
    await expect(trigger).toHaveText('Relier au compte d’un administrateur…')
    await trigger.click()
    const dialog = page.getByTestId('admin-link-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(`Relier ${player.displayName} à un administrateur`)
    await expect(page.getByLabel('Compte administrateur')).toHaveCount(1)
    expect(await violationsOf(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('relier un administrateur invité : « · invité » dans le choix, fiche reliée, lecture seule, aucun courriel', async ({ page, context }) => {
    awaitingLink()
    const email = await inviteAdmin(context.request, 'adm-invited')
    const player = await archivePlayerWithoutAccount(context.request, 2)
    await openCompetitor(page, player.id)
    await page.getByTestId('competitor-account-link-open').click()
    await page.getByTestId('admin-link-select').click()
    await page.getByRole('option', { name: `${email} · invité` }).click()
    await page.getByTestId('admin-link-confirm').click()
    await expect(page.getByTestId('competitor-account-feedback')).toContainText(`Fiche reliée au compte ${email}`)
    await expect(page.getByTestId('competitor-account-admin')).toHaveText('Administrateur')
    await expect(page.getByTestId('competitor-account-state')).toContainText(`Fiche reliée au compte administrateur ${email}.`)
    await expect(page.getByTestId('competitor-account-readonly')).toBeVisible()
    await expect(page.getByTestId('competitor-account-link')).toHaveCount(0)
  })

  test('fiche avec une invitation de joueur en attente : avertissement, liaison permise', async ({ page, context }) => {
    awaitingLink()
    await inviteAdmin(context.request, 'adm-warn')
    const player = await archivePlayerWithoutAccount(context.request, 3)
    const pending = uniqueEmail('joueur-invite')
    expect((await context.request.put(`/api/v1/competiteurs/${player.id}/compte`, { data: { email: pending } })).status()).toBe(200)
    await openCompetitor(page, player.id)
    await page.getByTestId('competitor-account-link-open').click()
    await expect(page.getByTestId('admin-link-warning')).toContainText(`${player.displayName} a une invitation de joueur en attente (${pending}).`)
    await page.getByTestId('admin-link-confirm').click()
    await expect(page.getByTestId('competitor-account-admin')).toBeVisible()
  })

  test('fiche dont le compte joueur est actif : action inactive, raison dite', async ({ page, context }) => {
    awaitingList()
    await signIn(context, 'member')
    const me = await (await context.request.get('/api/v1/moi')).json() as { competitor: { id: string } }
    await signIn(context, 'admin')
    await openCompetitor(page, me.competitor.id)
    await expect(page.getByTestId('competitor-account-link-open')).toBeDisabled()
    await expect(page.getByTestId('competitor-account-link-why')).toHaveText('Indisponible : cette fiche a un compte joueur actif.')
  })
})
