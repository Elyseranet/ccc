import { expect, test } from '@playwright/test'
import { createQualifiedEdition, createSemisPlayedEdition, selectAdminEdition } from '../helpers/edition-write'
import { hydrated } from '../helpers/random-draw'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-56 : admin, « Lancer la finale » (écriture sur une édition créée par le test, jamais 2026)
 *
 * @description
 * Les demi-finales sont jouées par l'API réelle : le tour à tirer est la finale, entre les deux vainqueurs. Un seul bouton enchaîne le tirage au sort (B-26) et la validation,
 * puis ouvre l'écran projecteur ; « Continuer » ramène à l'état « tour tiré ». Playwright tourne en `reducedMotion: 'reduce'` : « Continuer » est là d'emblée.
 ********************************************************/
const PAGE = '/admin/phase-finale/tirage'
/** `--origam-space---6` : écart entre la grille et le récapitulatif dans la maquette `admin-tirage-tour.html` (`.q-sec`, `margin-top`). */
const MOCKUP_GAP = 24
const VIEWPORTS = [{ width: 1440, height: 900 }, { width: 390, height: 844 }]

interface IAdminMatch { roundKind: string, status: string, sides: Array<{ displayName: string }> }

test.describe('admin tirage du tour : lancer la finale', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('demies validées : un seul bouton, projecteur avec les deux finalistes et le VS, match de finale créé, tour tiré', async ({ page, context }) => {
    test.setTimeout(240_000)
    const edition = await createSemisPlayedEdition(context.request, 'f56 finale')
    await selectAdminEdition(context, edition)
    await page.goto(PAGE)
    await hydrated(page)

    await expect(page.getByTestId('draw-random')).toHaveText('Lancer la finale')
    await expect(page.getByTestId('draw-restart-open')).toHaveCount(0)
    await expect(page.getByTestId('round-draw-validate-open')).toHaveCount(0)
    await expect(page.locator('[data-cy^="round-draw-select-"]')).toHaveCount(0)
    await expect(page.locator('.round-draw-entry__or')).toHaveCount(0)

    await page.getByTestId('draw-random').click()
    await expect(page.getByTestId('draw-projector')).toBeVisible()
    await expect(page.getByTestId('draw-projector-step')).toHaveText('Finale')
    const first = await page.getByTestId('draw-projector-first').innerText()
    const second = await page.getByTestId('draw-projector-second').innerText()
    expect(first).not.toBe('')
    expect(second).not.toBe('')
    await expect(page.getByTestId('draw-projector-live')).toHaveText(`Finale : ${first} contre ${second}.`)
    await expect(page.getByTestId('draw-projector')).toContainText('VS')

    await page.getByTestId('draw-continue').click()
    await expect(page.getByTestId('draw-projector')).toHaveCount(0)
    await expect(page.getByTestId('round-draw-state-drawn')).toBeVisible()
    await expect(page.getByTestId('round-draw-entry')).toHaveCount(0)

    const detail = await (await page.request.get(`/api/v1/editions/${edition.id}`)).json() as { rounds: Array<{ kind: string, status: string, matchCount: number }> }
    expect(detail.rounds.find(round => round.kind === 'FINAL')).toMatchObject({ status: 'DRAWN', matchCount: 1 })
    const matches = await (await page.request.get(`/api/v1/admin/editions/${edition.id}/matchs`)).json() as IAdminMatch[]
    const final = matches.filter(match => match.roundKind === 'FINAL')
    expect(final).toHaveLength(1)
    expect(final[0]!.sides.map(side => side.displayName).sort()).toEqual([first, second].sort())
  })

  for (const viewport of VIEWPORTS) {
    test(`espace entre la grille et le récapitulatif égal à la maquette à ${viewport.width} px`, async ({ page, context }) => {
      test.setTimeout(240_000)
      await page.setViewportSize(viewport)
      const edition = await createQualifiedEdition(context.request, `f56 espace ${viewport.width}`, 4)
      await selectAdminEdition(context, edition)
      await page.goto(PAGE)
      await hydrated(page)
      await expect(page.getByTestId('round-draw-recap')).toBeVisible()
      const gap = await page.evaluate(() => {
        const grid = document.querySelector('.admin-round-draw__grid')!.getBoundingClientRect()
        const recap = document.querySelector('[data-cy="round-draw-recap"]')!.getBoundingClientRect()
        return recap.top - grid.bottom
      })
      console.log(`F56-GAP ${viewport.width} = ${gap}`)
      expect(gap).toBe(MOCKUP_GAP)
    })
  }
})
