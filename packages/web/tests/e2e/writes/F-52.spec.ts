import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createQualifiedEdition, selectAdminEdition } from '../helpers/edition-write'
import type { IWriteEdition } from '../helpers/edition-write'
import { hydrated, POOL_COUNT, POOL_PLAYER_COUNT, poolEdition, reachPoolEntry } from '../helpers/random-draw'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-52 : admin, tirage au sort pas à pas et écran projecteur (écritures sur des éditions créées par le test, jamais 2026)
 *
 * @description
 * Poules : 20 inscrits (4 poules de 5, RG16), têtes de série choisies par l'écran, puis chaque clic sur « Tirer le joueur suivant » tire UN joueur par l'API réelle (B-26),
 * ouvre l'écran projecteur, « Continuer » revient à la liste ; le brouillon complet se valide comme avant. Tour : 4 poules de 2 donnent 8 joueurs (quarts, 4 affiches) ; un tirage
 * se mélange à une saisie manuelle, puis « Recommencer » (confirmation) remet le brouillon à zéro par `PUT /affectations`. Playwright tourne en `reducedMotion: 'reduce'` : le résultat
 * et « Continuer » sont là d'emblée ; les tests qui mesurent l'animation demandent `no-preference`.
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const PLAYER_COUNT = POOL_PLAYER_COUNT
const POOLS = POOL_COUNT
const ROUND_PAIRINGS = 4

interface IDrawView { id: string, kind: string, status: string, assignments: Array<{ participationId: string, poolNumber: number | null, pairingIndex: number | null, drawnOrder: number }> }

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
}

const draftsOf = async (page: Page, edition: IWriteEdition, kind: string): Promise<IDrawView | undefined> =>
  ((await (await page.request.get(`/api/v1/admin/editions/${edition.id}/tirages`)).json()) as IDrawView[]).filter(entry => entry.kind === kind).at(-1)

/** Un clic : la réponse du serveur ouvre l'écran projecteur ; « Continuer » (déjà visible sous reduced-motion) revient à la liste, focus au bouton. */
const drawAndContinue = async (page: Page) => {
  await page.getByTestId('draw-random').click()
  await expect(page.getByTestId('draw-projector')).toBeVisible()
  const live = await page.getByTestId('draw-projector-live').innerText()
  await page.getByTestId('draw-continue').click()
  await expect(page.getByTestId('draw-projector')).toHaveCount(0)
  return live
}

/**
 * Ferme la confirmation par Échap. Origam (`useStack`) ne bascule `globalTop` qu'au tour de boucle qui suit l'ouverture : un Échap envoyé dans cet intervalle est ignoré
 * (même défaut que `writes/F-11.spec.ts`, fiche docs/tickets/origam/stack-globaltop-apres-ouverture.md). On réessaie jusqu'à la fermeture.
 */
const dismissWithEscape = async (page: Page) => {
  await expect(async () => {
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('draw-restart-dialog')).toHaveCount(0, { timeout: 500 })
  }).toPass({ timeout: 5000 })
}

test.describe('admin tirage au sort et écran projecteur : parcours d’écriture', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('poules : tirer joueur par joueur jusqu’au bout (mélangé à une saisie manuelle), brouillon complet, puis validation', async ({ page, context }) => {
    test.setTimeout(300_000)
    const edition = await poolEdition(page, 'f52 poules')
    await selectAdminEdition(context, edition)
    await reachPoolEntry(page)
    await expect(page.getByTestId('draw-random')).toHaveText('Tirer le premier joueur')
    expect(await violationsOf(page)).toEqual([])

    const first = await drawAndContinue(page)
    expect(first).toMatch(/^.+ rejoint la poule 1\.$/)
    await expect(page.getByTestId('draw-random')).toBeFocused()
    await expect(page.getByTestId('draw-random')).toHaveText('Tirer le joueur suivant')
    await expect(page.getByTestId('draw-progress-text')).toContainText(`${POOLS + 1} / ${PLAYER_COUNT}`)

    // Saisie manuelle au milieu du tirage : le serveur repart des joueurs restants.
    const select = page.locator('[data-cy^="draw-select-"]')
    await select.locator('input').click()
    await page.getByRole('option').first().click()
    await expect(page.getByTestId('draw-progress-text')).toContainText(`${POOLS + 2} / ${PLAYER_COUNT}`)

    for (let placed = POOLS + 2; placed < PLAYER_COUNT; placed += 1) {
      await drawAndContinue(page)
      await expect(page.getByTestId('draw-progress-text')).toContainText(`${placed + 1} / ${PLAYER_COUNT}`)
    }
    await expect(page.getByTestId('draw-complete-chip')).toBeVisible()
    await expect(page.getByTestId('draw-random')).toHaveCount(0)
    await expect(page.getByTestId('draw-random-title')).toContainText(`Les ${PLAYER_COUNT} joueurs sont placés`)
    expect(await violationsOf(page)).toEqual([])

    const draft = await draftsOf(page, edition, 'POOLS')
    expect(draft?.assignments).toHaveLength(PLAYER_COUNT)
    expect(draft!.assignments.map(assignment => assignment.drawnOrder).sort((a, b) => a - b)).toEqual(Array.from({ length: PLAYER_COUNT }, (_, index) => index + 1))
    for (let pool = 1; pool <= POOLS; pool += 1) {
      expect(draft!.assignments.filter(assignment => assignment.poolNumber === pool)).toHaveLength(PLAYER_COUNT / POOLS)
    }

    await page.getByTestId('draw-entry-next').click()
    await page.getByTestId('draw-recap-next').click()
    await page.getByTestId('draw-validate-open').click()
    await page.getByTestId('draw-validate-confirm').click()
    await expect(page.getByTestId('draw-read-only')).toBeVisible()
    expect((await draftsOf(page, edition, 'POOLS'))?.status).toBe('VALIDATED')
  })

  test('poules : « Recommencer le tirage… » demande confirmation (Échap annule) puis ne garde que les têtes de série', async ({ page, context }) => {
    test.setTimeout(240_000)
    const edition = await poolEdition(page, 'f52 poules recommencer')
    await selectAdminEdition(context, edition)
    await reachPoolEntry(page)
    await expect(page.getByTestId('draw-restart-open')).toHaveCount(0)
    await drawAndContinue(page)
    await drawAndContinue(page)
    await expect(page.getByTestId('draw-progress-text')).toContainText(`${POOLS + 2} / ${PLAYER_COUNT}`)

    // Décision utilisateur 2026-11-16 : proposé dès qu'un joueur hors têtes de série est placé, rechargement compris.
    await page.reload()
    await hydrated(page)
    await expect(page.getByTestId('draw-restart-open')).toBeVisible()
    await page.getByTestId('draw-restart-open').click()
    const dialog = page.getByTestId('draw-restart-dialog')
    await expect(dialog).toContainText('2 joueurs placés')
    await expect(page.getByTestId('draw-restart-cancel')).toBeFocused()
    await dismissWithEscape(page)
    expect((await draftsOf(page, edition, 'POOLS'))?.assignments).toHaveLength(POOLS + 2)

    await page.getByTestId('draw-restart-open').click()
    await page.getByTestId('draw-restart-confirm').click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByTestId('draw-progress-text')).toContainText(`${POOLS} / ${PLAYER_COUNT}`)
    await expect(page.getByTestId('draw-random')).toHaveText('Tirer le premier joueur')
    expect((await draftsOf(page, edition, 'POOLS'))?.assignments).toHaveLength(POOLS)
  })

  test('tour : tirer une affiche, la mélanger à une saisie manuelle, recommencer avec confirmation, tirer jusqu’au brouillon complet', async ({ page, context }) => {
    test.setTimeout(240_000)
    const edition = await createQualifiedEdition(context.request, 'f52 quarts', ROUND_PAIRINGS)
    await selectAdminEdition(context, edition)
    await page.goto('/admin/phase-finale/tirage')
    await hydrated(page)
    await expect(page.getByTestId('round-draw-entry')).toBeVisible()
    await expect(page.getByTestId('draw-random')).toHaveText('Tirer la première affiche')
    await expect(page.getByTestId('draw-restart-open')).toHaveCount(0)
    expect(await violationsOf(page)).toEqual([])

    await page.getByTestId('draw-random').click()
    await expect(page.getByTestId('draw-projector')).toBeVisible()
    await expect(page.getByTestId('draw-projector-step')).toHaveText(`Affiche 1 / ${ROUND_PAIRINGS}`)
    const first = await page.getByTestId('draw-projector-first').innerText()
    const second = await page.getByTestId('draw-projector-second').innerText()
    await expect(page.getByTestId('draw-projector-live')).toHaveText(`Affiche 1 : ${first} contre ${second}.`)
    await page.getByTestId('draw-continue').click()
    await expect(page.getByTestId('draw-random')).toBeFocused()
    await expect(page.getByTestId('round-draw-pairing-1')).toContainText(first)
    await expect(page.getByTestId('round-draw-arrived')).toBeVisible()
    await expect(page.getByTestId('draw-random')).toHaveText('Tirer l’affiche suivante')

    // Saisie manuelle de l'affiche 2 : le serveur tire ensuite l'affiche 3.
    for (const side of [1, 2]) {
      await page.getByTestId(`round-draw-select-2-${side}`).locator('input').click()
      await page.getByRole('option').first().click()
    }
    await expect(page.getByTestId('round-draw-count')).toContainText(`2 / ${ROUND_PAIRINGS} affiches`)
    await page.getByTestId('draw-random').click()
    await expect(page.getByTestId('draw-projector-step')).toHaveText(`Affiche 3 / ${ROUND_PAIRINGS}`)
    await page.getByTestId('draw-continue').click()
    await expect(page.getByTestId('round-draw-count')).toContainText(`3 / ${ROUND_PAIRINGS} affiches`)

    await page.getByTestId('draw-restart-open').click()
    const dialog = page.getByTestId('draw-restart-dialog')
    await expect(dialog).toContainText('3 affiches du brouillon seront effacées')
    await expect(page.getByTestId('draw-restart-cancel')).toBeFocused()
    await dismissWithEscape(page)
    await page.getByTestId('draw-restart-open').click()
    await page.getByTestId('draw-restart-confirm').click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByTestId('round-draw-count')).toContainText(`0 / ${ROUND_PAIRINGS} affiches`)
    expect((await draftsOf(page, edition, 'ROUND'))?.assignments).toHaveLength(0)

    for (let pairing = 1; pairing <= ROUND_PAIRINGS; pairing += 1) {
      await drawAndContinue(page)
      await expect(page.getByTestId('round-draw-count')).toContainText(`${pairing} / ${ROUND_PAIRINGS} affiches`)
    }
    await expect(page.getByTestId('round-draw-complete-chip')).toBeVisible()
    await expect(page.getByTestId('draw-random')).toHaveCount(0)
    await expect(page.getByTestId('round-draw-validate-open')).toBeEnabled()
    await expect(page.getByTestId('round-draw-recap-link')).toHaveAttribute('href', '#round-draw-recap')
    await expect(page.locator('#round-draw-recap')).toHaveCount(1)
    expect(await violationsOf(page)).toEqual([])
    const draft = await draftsOf(page, edition, 'ROUND')
    expect(new Set(draft!.assignments.map(assignment => assignment.participationId)).size).toBe(ROUND_PAIRINGS * 2)
  })

  test('tour : brouillon complet, un tirage de plus donne 409 DRAW_DRAFT_COMPLETE (le bouton a disparu de l’écran)', async ({ page, context }) => {
    test.setTimeout(240_000)
    const edition = await createQualifiedEdition(context.request, 'f52 complet', ROUND_PAIRINGS)
    await selectAdminEdition(context, edition)
    await page.goto('/admin/phase-finale/tirage')
    await hydrated(page)
    for (let pairing = 1; pairing <= ROUND_PAIRINGS; pairing += 1) {
      await drawAndContinue(page)
    }
    await expect(page.getByTestId('draw-random')).toHaveCount(0)
    const draft = await draftsOf(page, edition, 'ROUND')
    const response = await page.request.post(`/api/v1/tirages/${draft!.id}/tirage-au-sort`)
    expect(response.status()).toBe(409)
    expect((await response.json() as { code: string }).code).toBe('DRAW_DRAFT_COMPLETE')
  })

  test('écran projecteur : Échap revient à la liste et rend le focus au bouton, 0 violation axe', async ({ page, context }) => {
    test.setTimeout(240_000)
    const edition = await createQualifiedEdition(context.request, 'f52 echap', ROUND_PAIRINGS)
    await selectAdminEdition(context, edition)
    await page.goto('/admin/phase-finale/tirage')
    await hydrated(page)
    await page.getByTestId('draw-random').click()
    const projector = page.getByTestId('draw-projector')
    await expect(projector).toBeVisible()
    await expect(projector).toHaveAttribute('role', 'dialog')
    await expect(projector).toHaveAttribute('aria-modal', 'true')
    expect(await violationsOf(page)).toEqual([])
    await expect(page.getByTestId('draw-continue')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(projector).toHaveCount(0)
    await expect(page.getByTestId('draw-random')).toBeFocused()
  })
})

test.describe('écran projecteur : animation CSS (mouvement autorisé)', () => {
  test.use({ reducedMotion: 'no-preference' })

  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('« Continuer » n’apparaît qu’à la fin de l’animation et prend le focus à animationend ; « Passer l’animation » le montre aussitôt', async ({ page, context }) => {
    test.setTimeout(120_000)
    const edition = await createQualifiedEdition(context.request, 'f52 anim', ROUND_PAIRINGS)
    await selectAdminEdition(context, edition)
    await page.goto('/admin/phase-finale/tirage')
    await hydrated(page)
    await page.getByTestId('draw-random').click()
    const projector = page.getByTestId('draw-projector')
    await expect(projector).toBeVisible()
    // Région live présente dès l'ouverture, avant la fin de l'animation.
    await expect(page.getByTestId('draw-projector-live')).toContainText(' contre ')
    await expect(page.getByTestId('draw-skip')).toBeVisible()
    await expect(page.getByTestId('draw-continue')).toBeHidden()
    await expect(page.getByTestId('draw-continue')).toBeVisible({ timeout: 8000 })
    await expect(page.getByTestId('draw-continue')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(projector).toHaveCount(0)
    await expect(page.getByTestId('draw-random')).toBeFocused()

    await page.getByTestId('draw-random').click()
    await expect(page.getByTestId('draw-skip')).toBeVisible()
    await page.getByTestId('draw-skip').click()
    await expect(page.getByTestId('draw-continue')).toBeVisible()
    await expect(page.getByTestId('draw-continue')).toBeFocused()
    await expect(page.getByTestId('draw-skip')).toBeHidden()
    await page.getByTestId('draw-continue').click()
    await expect(projector).toHaveCount(0)
  })
})

test.describe('écran projecteur : prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('résultat et « Continuer » sont là d’emblée, focus sur « Continuer », aucune animation, pas de « Passer l’animation »', async ({ page, context }) => {
    test.setTimeout(120_000)
    const edition = await createQualifiedEdition(context.request, 'f52 reduit', ROUND_PAIRINGS)
    await selectAdminEdition(context, edition)
    await page.goto('/admin/phase-finale/tirage')
    await hydrated(page)
    await page.getByTestId('draw-random').click()
    await expect(page.getByTestId('draw-projector')).toBeVisible()
    await expect(page.getByTestId('draw-projector-first')).toBeVisible()
    await expect(page.getByTestId('draw-continue')).toBeVisible()
    await expect(page.getByTestId('draw-continue')).toBeFocused()
    await expect(page.getByTestId('draw-skip')).toBeHidden()
    const animated = await page.getByTestId('draw-projector').locator('*').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).animationName !== 'none' && getComputedStyle(node).animationName !== '').length)
    expect(animated).toBe(0)
  })
})
