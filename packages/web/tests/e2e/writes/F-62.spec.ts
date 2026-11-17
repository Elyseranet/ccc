import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { API_ROUTES } from '../../../src/consts/api-routes.const'
import { API_ENDPOINT } from '../../../src/enums/api-endpoint.enum'
import { attachParticipant, createCompetitor, createRegistrationEdition, readCapturedMails, selectAdminEdition, uniqueEmail } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-62 : admin, saisir l'email d'un joueur et l'inviter (fiche compétiteur et liste des inscrits)
 *
 * @description
 * Les écritures `PUT /competiteurs/{id}/compte` (B-29) sont en `test.fixme` tant que la route porte un `pendingTicket` : le test se
 * réactive seul quand B-29 le retire de `API_ROUTES`. Le reste (état, libellé visible, validation, boîte, focus, Échap, axe) tourne
 * déjà. Les joueurs sans compte sont des compétiteurs d'archive (ils n'ont jamais eu de compte) : un différent par test.
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const LEGACY_EDITION_CODE = '2012a'
const AWAITING = API_ROUTES[API_ENDPOINT.COMPETITOR_ACCOUNT_EMAIL_SET].pendingTicket
const awaitingRoute = () => test.fixme(Boolean(AWAITING), `en attente de ${AWAITING} : PUT /competiteurs/{id}/compte`)

interface IArchivePlayer { id: string, displayName: string }

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
}

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => `${node.target.join(' ')} :: ${node.html.slice(0, 200)}`).join(', ')}`)
}

/** Le n-ième joueur d'archive sans compte (`account: null` dans la liste admin des inscrits d'une édition archivée). */
const archivePlayerWithoutAccount = async (request: APIRequestContext, index: number): Promise<IArchivePlayer> => {
  const editions = await (await request.get('/api/v1/editions')).json() as Array<{ id: string, code: string }>
  const legacy = editions.find(edition => edition.code === LEGACY_EDITION_CODE)
  if (!legacy) {
    throw new Error(`Édition d'archive ${LEGACY_EDITION_CODE} introuvable`)
  }
  const rows = await (await request.get(`/api/v1/admin/editions/${legacy.id}/participants`)).json() as Array<{ competitor: IArchivePlayer, account: unknown }>
  const player = rows.filter(row => row.account === null)[index]?.competitor
  if (!player) {
    throw new Error(`Pas de joueur d'archive sans compte n°${index}`)
  }
  return { id: player.id, displayName: player.displayName }
}

const openCompetitor = async (page: Page, id: string) => {
  await page.goto(`/admin/competiteurs/${id}`)
  await hydrated(page)
  await expect(page.getByTestId('competitor-account')).toBeVisible()
}

test.describe('admin fiche compétiteur : bloc « Compte »', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('sans compte : état, libellé visible lié au champ, email invalide refusé sans appel, 0 violation axe', async ({ page, context }) => {
    const player = await archivePlayerWithoutAccount(context.request, 0)
    const calls: string[] = []
    page.on('request', request => request.url().includes('/compte') && calls.push(request.method()))
    await openCompetitor(page, player.id)
    const block = page.getByTestId('competitor-account')
    await expect(block.getByTestId('competitor-account-state')).toContainText('Sans compte')
    await expect(page.getByLabel('Email · privé')).toHaveCount(1)
    await expect(page.getByTestId('competitor-account-submit')).toHaveText('Envoyer l’invitation')
    await page.getByLabel('Email · privé').fill('pas-un-email')
    await page.getByTestId('competitor-account-submit').click()
    await expect(block).toContainText('Adresse email invalide')
    expect(calls).toEqual([])
    expect(await violationsOf(page)).toEqual([])
  })

  test('sans compte : invitation envoyée, courriel capturé, la fiche passe à « invitation envoyée »', async ({ page, context }) => {
    awaitingRoute()
    const player = await archivePlayerWithoutAccount(context.request, 1)
    const email = uniqueEmail('archive')
    await openCompetitor(page, player.id)
    await page.getByLabel('Email · privé').fill(email)
    await page.getByTestId('competitor-account-submit').click()
    await expect(page.getByTestId('competitor-account-feedback')).toContainText(`Invitation envoyée à ${email}`)
    await expect(page.getByTestId('competitor-account-state')).toContainText(email)
    await expect(page.getByTestId('competitor-account-submit')).toHaveText('Corriger et renvoyer')
    expect(readCapturedMails().some(mail => mail.to === email)).toBe(true)
  })

  test('invité : correction de l’email, nouveau courriel ; email déjà pris refusé', async ({ page, context }) => {
    awaitingRoute()
    const player = await archivePlayerWithoutAccount(context.request, 2)
    const first = uniqueEmail('archive-a')
    const second = uniqueEmail('archive-b')
    await openCompetitor(page, player.id)
    await page.getByLabel('Email · privé').fill(first)
    await page.getByTestId('competitor-account-submit').click()
    await expect(page.getByTestId('competitor-account-submit')).toHaveText('Corriger et renvoyer')
    await page.getByLabel('Email · privé').fill(second)
    await page.getByTestId('competitor-account-submit').click()
    await expect(page.getByTestId('competitor-account-state')).toContainText(second)
    expect(readCapturedMails().some(mail => mail.to === second)).toBe(true)
    const taken = await createCompetitor(context.request, 'f62 email pris')
    await page.getByLabel('Email · privé').fill(taken.email)
    await page.getByTestId('competitor-account-submit').click()
    await expect(page.getByTestId('competitor-account-error')).toContainText('Email déjà utilisé')
    await expect(page.getByLabel('Email · privé')).toHaveAttribute('aria-invalid', 'true')
  })

  test('compte actif : email en lecture seule, ni champ ni bouton', async ({ page, context }) => {
    awaitingRoute()
    await signIn(context, 'member')
    const me = await (await context.request.get('/api/v1/moi')).json() as { competitor: { id: string } }
    await signIn(context, 'admin')
    await openCompetitor(page, me.competitor.id)
    await expect(page.getByTestId('competitor-account-readonly')).toBeVisible()
    await expect(page.getByTestId('competitor-account').locator('input')).toHaveCount(0)
    await expect(page.getByTestId('competitor-account-submit')).toHaveCount(0)
  })
})

test.describe('admin inscrits : « Inviter » un joueur sans compte', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  const openList = async (page: Page, context: Parameters<typeof selectAdminEdition>[0], request: APIRequestContext, index: number) => {
    const { edition } = await createRegistrationEdition(request, `f62 inviter ${index}`)
    const player = await archivePlayerWithoutAccount(request, index + 3)
    await attachParticipant(request, edition, { id: player.id, email: '', firstName: '', lastName: '', displayName: player.displayName })
    await selectAdminEdition(context, edition)
    await page.goto('/admin/participants')
    await hydrated(page)
    await expect(page.getByTestId('participant-summary')).toContainText('inscrit')
    return player
  }

  test('« Inviter » n’apparaît que sur le joueur sans compte ; la boîte a un libellé visible, le focus sur le champ, Échap la ferme et rend le focus, 0 violation axe', async ({ page, context }) => {
    const player = await openList(page, context, context.request, 0)
    await expect(page.getByTestId('participant-invite')).toHaveCount(1)
    const trigger = page.getByRole('button', { name: `Inviter ${player.displayName}` })
    await trigger.click()
    const dialog = page.getByTestId('participant-invite-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(`Inviter ${player.displayName}`)
    await expect(page.getByLabel('Email · privé')).toHaveCount(1)
    await expect(page.getByTestId('participant-invite-email').locator('input')).toBeFocused()
    await page.getByTestId('participant-invite-confirm').click()
    await expect(dialog).toContainText('Adresse email invalide')
    expect(await violationsOf(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('saisie puis « Envoyer l’invitation » : snackbar, courriel capturé, le joueur passe à « Invité » avec « Renvoyer »', async ({ page, context }) => {
    awaitingRoute()
    const player = await openList(page, context, context.request, 1)
    const email = uniqueEmail('inviter')
    await page.getByRole('button', { name: `Inviter ${player.displayName}` }).click()
    await page.getByTestId('participant-invite-email').locator('input').fill(email)
    await page.getByTestId('participant-invite-confirm').click()
    await expect(page.getByTestId('participant-feedback')).toContainText(`Invitation envoyée à ${email}`)
    await expect(page.getByTestId('participant-invite-dialog')).toBeHidden()
    await expect(page.getByTestId('participant-account-INVITED').first()).toBeVisible()
    await expect(page.getByRole('button', { name: `Renvoyer l’invitation à ${player.displayName}` })).toBeVisible()
    expect(readCapturedMails().some(mail => mail.to === email)).toBe(true)
  })

  test('email déjà pris : la boîte reste ouverte avec le refus', async ({ page, context }) => {
    awaitingRoute()
    const player = await openList(page, context, context.request, 2)
    const taken = await createCompetitor(context.request, 'f62 liste email pris')
    await page.getByRole('button', { name: `Inviter ${player.displayName}` }).click()
    await page.getByTestId('participant-invite-email').locator('input').fill(taken.email)
    await page.getByTestId('participant-invite-confirm').click()
    await expect(page.getByTestId('participant-invite-error')).toContainText('Email déjà utilisé')
    await expect(page.getByTestId('participant-invite-dialog')).toBeVisible()
  })
})
