import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createQualifiedEdition, createTiedPoolsEdition, selectAdminEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-25 : admin, tirage d'un tour de phase finale (écritures sur des éditions créées par le test, jamais 2026)
 *
 * @description
 * Chaque test crée SON édition par l'API réelle (`createQualifiedEdition` : poules de deux joueurs jouées, liste des qualifiés arrêtée) ; le tirage lui-même passe par l'écran,
 * joueur par joueur. 4 poules donnent 8 joueurs (quarts, tour déduit), 6 poules 12 joueurs (tour à choisir, 673e5b4b), 4 poules avec barrages 4 joueurs à tirer, les 4 premiers de poule attendent (RG14).
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const PAGE = '/admin/phase-finale/tirage'

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => `${node.target.join(' ')} :: ${node.html.slice(0, 260)} :: ${node.any[0]?.message ?? ''}`).join(', ')}`)
}

const openRoundDraw = async (page: Page) => {
  await page.goto(PAGE)
  await hydrated(page)
}

/** Place un joueur dans le sélecteur actif de l'affiche donnée (le premier côté libre) : premier joueur de la liste. */
const placeNext = async (page: Page, pairing: number, side: 1 | 2) => {
  const select = page.getByTestId(`round-draw-select-${pairing}-${side}`)
  await select.locator('input').click()
  await page.getByRole('option').first().click()
}

const placePairings = async (page: Page, count: number) => {
  for (let pairing = 1; pairing <= count; pairing += 1) {
    await placeNext(page, pairing, 1)
    await placeNext(page, pairing, 2)
    await expect(page.getByTestId('round-draw-count')).toContainText(`${pairing} /`)
  }
}

test.describe('admin tirage du tour : écritures sur une édition créée par le test', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('liste des qualifiés non arrêtée : message et lien vers la qualification, le stepper de phase mène à la page, 0 violation axe', async ({ page, context }) => {
    const { edition } = await createTiedPoolsEdition(context.request, 'f25 non arretee', 3)
    await selectAdminEdition(context, edition)
    await openRoundDraw(page)
    await expect(page.getByTestId('page-title')).toHaveText('Tirage du tour')
    await expect(page.getByTestId('round-draw-state-qualification-pending')).toBeVisible()
    await expect(page.getByTestId('round-draw-state-qualification-pending-link')).toHaveAttribute('href', '/admin/phase-finale/qualification')
    await expect(page.getByTestId('round-draw-entry')).toHaveCount(0)
    expect(await violationsOf(page)).toEqual([])
  })

  test('quarts (8 joueurs, tour déduit) : saisie affiche par affiche, Changer, reprise du brouillon, validation définitive, matchs à 10 points, lien vers les scores', async ({ page, context }) => {
    const edition = await createQualifiedEdition(context.request, 'f25 quarts', 4)
    await selectAdminEdition(context, edition)
    await openRoundDraw(page)
    await expect(page.getByTestId('round-draw-entry')).toBeVisible()
    await expect(page.getByTestId('round-draw-round')).toContainText('Tour à tirer : Quarts, 8 joueurs.')
    await expect(page.getByTestId('round-draw-count')).toHaveText('0 / 4 affiches · 8 joueurs restants')
    await expect(page.getByTestId('round-draw-validate-why')).toHaveText('Indisponible : 4 affiches restent à saisir.')
    expect(await violationsOf(page)).toEqual([])

    await placeNext(page, 1, 1)
    await expect(page.getByTestId('round-draw-snackbar')).toContainText('Brouillon enregistré')
    await placeNext(page, 1, 2)
    await expect(page.getByTestId('round-draw-count')).toHaveText('1 / 4 affiches · 6 joueurs restants')
    await expect(page.getByTestId('round-draw-rest').getByTestId('round-draw-rest-item')).toHaveCount(6)

    await page.reload()
    await hydrated(page)
    await expect(page.getByTestId('round-draw-count')).toHaveText('1 / 4 affiches · 6 joueurs restants')
    const firstNames = await page.getByTestId('round-draw-pairing-1').locator('b').allTextContents()
    expect(firstNames).toHaveLength(2)

    await page.getByTestId('round-draw-change-1').click()
    await expect(page.getByTestId('round-draw-count')).toHaveText('0 / 4 affiches · 8 joueurs restants')
    await placePairings(page, 4)
    await expect(page.getByTestId('round-draw-validate-why')).toHaveCount(0)
    expect(await violationsOf(page)).toEqual([])

    await page.getByTestId('round-draw-validate-open').click()
    const dialog = page.getByTestId('round-draw-validate-dialog')
    await expect(dialog).toContainText('4 matchs seront créés, à 10 points')
    await expect(dialog).toContainText('il n’est pas possible de revenir en arrière')
    await expect(page.getByTestId('round-draw-validate-cancel')).toBeFocused()
    expect(await violationsOf(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)

    await page.getByTestId('round-draw-validate-open').click()
    await page.getByTestId('round-draw-validate-confirm').click()
    await expect(page.getByTestId('round-draw-state-drawn')).toBeVisible()
    await expect(page.getByTestId('round-draw-state-drawn-link')).toHaveAttribute('href', '/admin/matchs?tour=QUARTER')
    await expect(page.getByTestId('round-draw-entry')).toHaveCount(0)
    const detail = await (await page.request.get(`/api/v1/editions/${edition.id}`)).json() as { status: string, rounds: Array<{ kind: string, status: string, matchCount: number }> }
    expect(detail.status).toBe('PLAYOFFS')
    expect(detail.rounds.find(entry => entry.kind === 'QUARTER')).toMatchObject({ status: 'DRAWN', matchCount: 4 })
    const matches = await (await page.request.get(`/api/v1/admin/editions/${edition.id}/matchs`)).json() as Array<{ roundKind: string, targetScore: number }>
    expect(matches.filter(match => match.roundKind === 'QUARTER').map(match => match.targetScore)).toEqual([10, 10, 10, 10])
    expect(await violationsOf(page)).toEqual([])
  })

  test('12 joueurs : le tour se choisit avant la première affiche, « Changer de tour » remplace le brouillon et annonce les affiches perdues', async ({ page, context }) => {
    const edition = await createQualifiedEdition(context.request, 'f25 choix', 6)
    await selectAdminEdition(context, edition)
    await openRoundDraw(page)
    const choice = page.getByTestId('round-draw-choice')
    await expect(choice).toContainText('Quel tour tirez-vous avec ces 12 joueurs ? (6 affiches)')
    await expect(choice.locator('fieldset')).toHaveCount(1)
    expect(await violationsOf(page)).toEqual([])
    await page.getByTestId('round-draw-start').click()
    await expect(page.getByTestId('round-draw-entry')).toBeVisible()
    await expect(page.getByTestId('round-draw-round')).toContainText('Tour : Quarts · 12 joueurs · 6 affiches')
    await placeNext(page, 1, 1)
    await placeNext(page, 1, 2)

    await page.getByTestId('round-draw-change-round').click()
    const dialog = page.getByTestId('round-draw-change-dialog')
    await expect(dialog).toContainText('L’affiche déjà enregistrée sera perdue.')
    await expect(page.getByTestId('round-draw-change-cancel')).toBeFocused()
    expect(await violationsOf(page)).toEqual([])
    await page.getByTestId('round-draw-change-confirm').click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByTestId('round-draw-round')).toContainText('Tour : Demi-finales')
    await expect(page.getByTestId('round-draw-count')).toContainText('0 / 6 affiches')
    const drafts = await (await page.request.get(`/api/v1/admin/editions/${edition.id}/tirages`)).json() as Array<{ kind: string, roundKind: string, status: string, assignments: unknown[] }>
    const draft = drafts.filter(entry => entry.kind === 'ROUND').at(-1)!
    expect(draft).toMatchObject({ roundKind: 'SEMI', status: 'DRAFT' })
    expect(draft.assignments).toHaveLength(0)
  })

  test('barrages : les premiers de poule attendent et ne sont pas proposés ; les affiches tirées créent le tour de barrages', async ({ page, context }) => {
    const edition = await createQualifiedEdition(context.request, 'f25 barrages', 4, true)
    await selectAdminEdition(context, edition)
    await openRoundDraw(page)
    await expect(page.getByTestId('round-draw-entry')).toBeVisible()
    await expect(page.getByTestId('round-draw-pool')).toContainText('Premiers de poule (en attente)')
    await expect(page.getByTestId('round-draw-rest').getByTestId('round-draw-rest-item')).toHaveCount(4)
    await expect(page.getByTestId('round-draw-count')).toContainText('0 / 2 affiches · 4 joueurs restants')
    await placePairings(page, 2)
    expect(await violationsOf(page)).toEqual([])
    await page.getByTestId('round-draw-validate-open').click()
    await page.getByTestId('round-draw-validate-confirm').click()
    await expect(page.getByTestId('round-draw-state-drawn')).toBeVisible()
    const detail = await (await page.request.get(`/api/v1/editions/${edition.id}`)).json() as { rounds: Array<{ kind: string, status: string, matchCount: number }> }
    expect(detail.rounds.find(entry => entry.kind === 'PLAYOFF')).toMatchObject({ status: 'DRAWN', matchCount: 2 })
  })
})
