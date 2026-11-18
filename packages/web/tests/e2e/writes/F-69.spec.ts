import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { uniqueEmail } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-69 : relier la fiche d'un compétiteur au compte d'un administrateur (bloc « Compte et invitation »)
 *
 * @description
 * Lecture de la liste `GET /admin/administrateurs` (B-31) et lien par `PUT /competiteurs/{id}/compte` (B-32, `linked`, 409
 * `ACCOUNT_ALREADY_LINKED`), sur la vraie base. Un administrateur sans fiche s'obtient par `POST /admin/administrateurs` ; les fiches sont des
 * compétiteurs d'archive sans compte (un différent par test, pris par la fin de la liste : F-62 prend ceux du début).
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const IN_PROGRESS_EDITION_CODE = '2026'

interface IArchivePlayer { id: string, displayName: string }

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
}

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => `${node.target.join(' ')} :: ${node.html.slice(0, 200)}`).join(', ')}`)
}

/** Joueurs d'archive sans compte, pris par la fin de la liste : F-62 consomme ceux du début, et chaque test d'ici en transforme un en compte. */
const archivePlayerWithoutAccount = async (request: APIRequestContext, index: number): Promise<IArchivePlayer> => {
  const editions = await (await request.get('/api/v1/editions')).json() as Array<{ id: string, code: string }>
  const players = new Map<string, IArchivePlayer>()
  for (const edition of editions.filter(candidate => candidate.code !== IN_PROGRESS_EDITION_CODE)) {
    const rows = await (await request.get(`/api/v1/admin/editions/${edition.id}/participants`)).json() as Array<{ competitor: IArchivePlayer, account: unknown }>
    rows.filter(row => row.account === null).forEach(row => players.set(row.competitor.id, { id: row.competitor.id, displayName: row.competitor.displayName }))
  }
  const player = [...players.values()].at(-(index + 1))
  if (!player) {
    throw new Error(`Pas de joueur d'archive sans compte n°${index}`)
  }
  return player
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

  test('une fiche sans compte : l’action ouvre la boîte (libellé visible, focus, Échap rend le focus), 0 violation axe', async ({ page, context }) => {
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
    const email = await inviteAdmin(context.request, 'adm-invited')
    const player = await archivePlayerWithoutAccount(context.request, 2)
    await openCompetitor(page, player.id)
    await page.getByTestId('competitor-account-link-open').click()
    await page.getByTestId('admin-link-select').click()
    await page.getByRole('option', { name: `${email} · invité` }).click()
    await page.getByTestId('admin-link-confirm').click()
    await expect(page.getByTestId('competitor-account-feedback')).toContainText(`Fiche reliée au compte ${email}`)
    await expect(page.getByTestId('competitor-account-admin')).toHaveText('Administrateur')
    await expect(page.getByTestId('competitor-account-state')).toContainText('Invité')
    await expect(page.getByTestId('competitor-account-state')).toContainText(`Fiche reliée au compte administrateur ${email}.`)
    await expect(page.getByTestId('competitor-account-readonly')).toBeVisible()
    await expect(page.getByTestId('competitor-account-link')).toHaveCount(0)
  })

  test('fiche avec une invitation de joueur en attente : avertissement, liaison permise', async ({ page, context }) => {
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
    await signIn(context, 'member')
    const me = await (await context.request.get('/api/v1/moi')).json() as { competitor: { id: string } }
    await signIn(context, 'admin')
    await openCompetitor(page, me.competitor.id)
    await expect(page.getByTestId('competitor-account-link-open')).toBeDisabled()
    await expect(page.getByTestId('competitor-account-link-why')).toHaveText('Indisponible : cette fiche a un compte joueur actif.')
  })
})
