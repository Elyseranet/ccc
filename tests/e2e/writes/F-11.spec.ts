import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { attachParticipant, createCompetitor, createRegistrationEdition, selectAdminEdition } from '../helpers/edition-write'
import type { IWriteEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-11 : admin, tirage des poules, parcours d'ÉCRITURE (QA-3)
 *
 * @description
 * Chaque test crée SA propre édition en inscriptions et ses propres compétiteurs par l'API réelle (helper partagé de F-09,
 * `createRegistrationEdition` / `attachParticipant`) : ni les archives ni 2026 ne sont touchées. 20 inscrits : la table
 * « Config poules » (RG16) propose 4 poules de 5. Un nouvel inscrit n'a pas de points ACP : toutes les têtes de série sont
 * à égalité sur la frontière (RG10), l'écran demande donc à l'administrateur de les choisir.
 * Le tirage physique est saisi poule après poule (RG11) : un seul choix actif, dans la première place libre de la poule en cours.
 * Sont vérifiés par l'API réelle : le brouillon enregistré à chaque affectation, la validation irréversible et les matchs de poule générés.
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const PLAYER_COUNT = 20
const EXPECTED_POOLS = 4
const POOL_SIZE = 5
/** Défauts d'Origam 2.37.4 sur le menu ouvert de `origam-select` (Origam #1331) : seuls ces deux éléments, seules ces deux règles. */
const KNOWN_OPEN_MENU_VIOLATIONS = ['aria-required-attr', 'aria-required-children']

interface IDrawView { id: string, kind: string, status: string, assignments: Array<{ participationId: string, poolNumber: number | null, drawnOrder: number }> }

const violationsOf = async (page: Page, ignore: string[] = []) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.filter(violation => !ignore.includes(violation.id)).map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
}

const openDraws = async (page: Page) => {
  await page.goto('/admin/tirages')
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('page-title')).toBeVisible()
}

/** Une édition en inscriptions avec `PLAYER_COUNT` inscrits (le premier vient du helper, les autres sont rattachés un à un). */
const editionWithPlayers = async (page: Page, label: string): Promise<IWriteEdition> => {
  const { edition } = await createRegistrationEdition(page.context().request, label)
  for (let index = 1; index < PLAYER_COUNT; index += 1) {
    const competitor = await createCompetitor(page.context().request, `${label} ${index}`, { lastName: `Joueur ${String(index).padStart(2, '0')}` })
    await attachParticipant(page.context().request, edition, competitor)
  }
  return edition
}

const draftsOf = async (page: Page, edition: IWriteEdition): Promise<IDrawView[]> =>
  await (await page.request.get(`/api/v1/admin/editions/${edition.id}/tirages`)).json() as IDrawView[]

/** Étapes 1 et 2 : nombre de poules proposé, têtes de série (égalités tranchées si l'écran les demande), confirmation. */
const reachEntry = async (page: Page) => {
  await expect(page.getByTestId('draw-pool-count').locator('input')).toHaveValue(String(EXPECTED_POOLS))
  await page.getByTestId('draw-parameters-next').click()
  await expect(page.getByTestId('draw-seeds')).toBeVisible()
  for (const tie of await page.getByTestId('draw-seed-tie').all()) {
    const needed = Number(await tie.getAttribute('data-needed') ?? '0')
    const boxes = tie.locator('[data-cy^="draw-seed-choice-"] input[type="checkbox"]')
    for (let index = 0; index < needed; index += 1) {
      await boxes.nth(index).check()
    }
  }
  await expect(page.getByTestId('draw-seeds-confirm')).toBeEnabled()
  await page.getByTestId('draw-seeds-confirm').click()
  await expect(page.getByTestId('draw-assignment')).toBeVisible()
}

/** Place le premier joueur « À placer » par le seul choix actif (RG11). */
const placeNext = async (page: Page) => {
  const select = page.locator('[data-cy^="draw-select-"]')
  await expect(select).toHaveCount(1)
  await select.locator('input').click()
  await page.getByRole('option').first().click()
}

/**
 * Ferme la confirmation par Échap ou clic extérieur. Origam (`useStack`) ne bascule `globalTop` qu'au tour de boucle qui suit l'ouverture :
 * une touche ou un clic envoyé dans cet intervalle est ignoré (mesuré : le premier Échap est perdu, le second, 25 ms plus tard, ferme).
 * Un humain n'y arrive pas, Playwright si (fiche docs/tickets/origam/stack-globaltop-apres-ouverture.md, Origam : à déposer). On réessaie donc jusqu'à la fermeture : une confirmation réellement persistante échouerait toujours.
 */
const dismissDialog = async (page: Page, dismiss: () => Promise<void>) => {
  await expect(async () => {
    await dismiss()
    await expect(page.getByTestId('draw-validate-dialog')).toHaveCount(0, { timeout: 500 })
  }).toPass({ timeout: 5000 })
}

test.describe('admin tirages : parcours complet sur une édition créée par le test', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('paramètres, têtes de série, saisie poule après poule, récapitulatif, validation : brouillon à chaque affectation puis tirage validé', async ({ page, context }) => {
    test.setTimeout(240_000)
    const edition = await editionWithPlayers(page, 'tirage complet')
    await selectAdminEdition(context, edition)
    await openDraws(page)

    expect(await violationsOf(page)).toEqual([])
    await reachEntry(page)
    await expect(page.getByTestId('draw-progress-text')).toContainText(`${EXPECTED_POOLS} / ${PLAYER_COUNT}`)

    for (let placed = EXPECTED_POOLS; placed < PLAYER_COUNT; placed += 1) {
      const current = Math.floor((placed - EXPECTED_POOLS) / (POOL_SIZE - 1)) + 1
      await expect(page.getByTestId(`draw-pool-current-${current}`)).toBeVisible()
      await placeNext(page)
      await expect(page.getByTestId('draw-progress-text')).toContainText(`${placed + 1} / ${PLAYER_COUNT}`)
    }
    await expect(page.getByTestId('draw-rest')).toContainText('Tous les joueurs sont placés')

    // L'avancement est optimiste : chaque affectation part ensuite en file vers le serveur (une requête par affectation).
    const draftOf = async () => (await draftsOf(page, edition)).find(entry => entry.kind === 'POOLS')
    await expect.poll(async () => (await draftOf())?.assignments.length).toBe(PLAYER_COUNT)
    const draft = await draftOf()
    expect(draft?.status).toBe('DRAFT')
    const orders = draft!.assignments.map(assignment => assignment.drawnOrder).sort((a, b) => a - b)
    expect(orders).toEqual(Array.from({ length: PLAYER_COUNT }, (_, index) => index + 1))

    await page.getByTestId('draw-entry-next').click()
    await expect(page.getByTestId('draw-recap')).toBeVisible()
    for (let pool = 1; pool <= EXPECTED_POOLS; pool += 1) {
      await expect(page.getByTestId(`draw-recap-pool-${pool}`)).toBeVisible()
    }
    expect(await violationsOf(page)).toEqual([])

    await page.getByTestId('draw-recap-next').click()
    await expect(page.getByTestId('draw-validation')).toBeVisible()
    await page.getByTestId('draw-validate-open').click()
    const dialog = page.getByTestId('draw-validate-dialog')
    await expect(dialog).toBeVisible()
    await expect(page.getByTestId('draw-validate-cancel')).toBeFocused()
    expect(await violationsOf(page, KNOWN_OPEN_MENU_VIOLATIONS)).toEqual([])

    await page.getByTestId('draw-validate-confirm').click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByTestId('draw-read-only')).toBeVisible()

    const validated = (await draftsOf(page, edition)).find(entry => entry.kind === 'POOLS')
    expect(validated?.status).toBe('VALIDATED')
    const { total } = await (await page.request.get(`/api/v1/editions/${edition.code}/matchs`)).json() as { total: number }
    expect(total).toBe(EXPECTED_POOLS * ((POOL_SIZE * (POOL_SIZE - 1)) / 2))
  })

  test('saisie à l’étape 3 : 0 violation axe, un seul champ actif nommé, saisie au clavier seul, liste « À placer » atteignable', async ({ page, context }) => {
    test.setTimeout(240_000)
    const edition = await editionWithPlayers(page, 'tirage clavier')
    await selectAdminEdition(context, edition)
    await openDraws(page)
    await reachEntry(page)

    expect(await violationsOf(page)).toEqual([])
    const select = page.locator('[data-cy^="draw-select-"]')
    await expect(select).toHaveCount(1)
    await expect(page.getByRole('combobox', { name: /Poule 1 : joueur tiré/ }).first()).toBeVisible()
    await expect(page.getByTestId('draw-rest')).toBeVisible()

    // Clavier seul : focus sur le champ actif, ouverture de la liste, premier joueur, validation.
    await select.locator('input').focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('draw-progress-text')).toContainText(`${EXPECTED_POOLS + 1} / ${PLAYER_COUNT}`)

    // La liste « À placer » défile : elle est focalisable et nommée (axe : scrollable-region-focusable).
    const rest = page.getByRole('list', { name: 'Joueurs à placer' })
    await rest.focus()
    await expect(rest).toBeFocused()
    expect(await violationsOf(page)).toEqual([])
  })

  test('annuler la confirmation ne valide rien ; Échap et le clic extérieur ferment le dialogue', async ({ page, context }) => {
    test.setTimeout(240_000)
    const edition = await editionWithPlayers(page, 'tirage annule')
    await selectAdminEdition(context, edition)
    await openDraws(page)
    await reachEntry(page)
    for (let placed = EXPECTED_POOLS; placed < PLAYER_COUNT; placed += 1) {
      await placeNext(page)
      await expect(page.getByTestId('draw-progress-text')).toContainText(`${placed + 1} / ${PLAYER_COUNT}`)
    }
    await page.getByTestId('draw-entry-next').click()
    await page.getByTestId('draw-recap-next').click()
    await page.getByTestId('draw-validate-open').click()
    await expect(page.getByTestId('draw-validate-dialog')).toBeVisible()
    await dismissDialog(page, () => page.keyboard.press('Escape'))
    // Le clic hors du dialogue annule aussi (décision ux 0ea5092e) : la validation n'a lieu que par le bouton explicite.
    await page.getByTestId('draw-validate-open').click()
    await expect(page.getByTestId('draw-validate-dialog')).toBeVisible()
    await dismissDialog(page, () => page.mouse.click(5, 5))
    expect((await draftsOf(page, edition)).find(entry => entry.kind === 'POOLS')?.status).toBe('DRAFT')
  })

  test('un nombre de poules hors bornes garde sa saisie et bloque « Suivant » (aucune correction silencieuse)', async ({ page, context }) => {
    const edition = await editionWithPlayers(page, 'tirage bornes')
    await selectAdminEdition(context, edition)
    await openDraws(page)

    const field = page.getByTestId('draw-pool-count').locator('input')
    await field.fill('25')
    await field.blur()
    await expect(field).toHaveValue('25')
    await expect(page.getByTestId('draw-parameters')).toContainText('entier de 1 à 20')
    await expect(page.getByTestId('draw-parameters-next')).toBeDisabled()

    await field.fill('')
    await expect(page.getByTestId('draw-parameters-next')).toBeDisabled()
    await field.fill('4')
    await expect(page.getByTestId('draw-parameters-next')).toBeEnabled()
  })

  test('hors de la table « Config poules » (RG16) : aucun nombre de poules proposé, le champ est vide et l’erreur n’apparaît qu’après saisie', async ({ page, context }) => {
    const { edition } = await createRegistrationEdition(context.request, 'tirage hors table')
    for (let index = 1; index < 7; index += 1) {
      await attachParticipant(context.request, edition, await createCompetitor(context.request, `hors table ${index}`))
    }
    await selectAdminEdition(context, edition)
    await openDraws(page)

    const field = page.getByTestId('draw-pool-count').locator('input')
    await expect(field).toHaveValue('')
    await expect(page.getByTestId('draw-parameters')).not.toContainText('entier de 1 à 20')
    await expect(page.getByTestId('draw-parameters-next')).toBeDisabled()
    await field.fill('2')
    await expect(page.getByTestId('draw-parameters-next')).toBeEnabled()
  })

  test('moins de 2 inscrits : le tirage n’est pas proposé', async ({ page, context }) => {
    const { edition } = await createRegistrationEdition(context.request, 'tirage trop peu')
    await selectAdminEdition(context, edition)
    await openDraws(page)
    await expect(page.getByTestId('draw-too-few')).toBeVisible()
    await expect(page.getByTestId('draw-parameters-next')).toHaveCount(0)
  })

  test('une saisie interrompue est reprise : le brouillon du serveur est relu au rechargement', async ({ page, context }) => {
    test.setTimeout(240_000)
    const edition = await editionWithPlayers(page, 'tirage reprise')
    await selectAdminEdition(context, edition)
    await openDraws(page)
    await reachEntry(page)
    for (let placed = EXPECTED_POOLS; placed < EXPECTED_POOLS + 3; placed += 1) {
      await placeNext(page)
      await expect(page.getByTestId('draw-progress-text')).toContainText(`${placed + 1} / ${PLAYER_COUNT}`)
    }
    await openDraws(page)
    await expect(page.getByTestId('draw-assignment')).toBeVisible()
    await expect(page.getByTestId('draw-progress-text')).toContainText(`${EXPECTED_POOLS + 3} / ${PLAYER_COUNT}`)
  })
})
