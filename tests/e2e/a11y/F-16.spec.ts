import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { pairUrl } from '../helpers/head-to-head'

/*********************************************************
 * F-16 : face-à-face, G10 (« Poule n » dans la colonne Tour) et G9 (résultats inconnus de la paire)
 *
 * @description
 * Données réelles de la base de test (ARCH-9), paires trouvées dans l'API des face-à-face :
 * - POOL_PAIR : une rencontre de poule (poule 2), aucun résultat inconnu ;
 * - PLURAL_PAIR : 2 rencontres au résultat inconnu, aucune avec score ;
 * - SINGULAR_PAIR : 1 rencontre au résultat inconnu, 1 avec score.
 ********************************************************/
const POOL_PAIR = { a: '09f94f14-e46c-4280-8772-567398d8f1b2', b: 'e5836fbc-7b09-46b4-8ea2-f334e4aa76fc' }
const PLURAL_PAIR = { a: '0c1bf0d4-443d-46e2-b6f9-2eab5fd41cb5', b: '720a2ba5-bdf4-4609-953a-48c40470bc74' }
const SINGULAR_PAIR = { a: '09f94f14-e46c-4280-8772-567398d8f1b2', b: '504abe67-a3c4-401f-b5d8-2ea7506c4bef' }
const STATIC_NOTE = 'Les rencontres sans score connu sont comptées à part, jamais comme des nuls.'

const hydrated = async (page: Page, url: string) => {
  await page.goto(url)
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
}

test.describe('face-à-face : G10 et G9 sur les vraies données', () => {
  test('G10 : un match de poule affiche « Poule n » dans la colonne Tour', async ({ page }) => {
    await hydrated(page, pairUrl(POOL_PAIR.a, POOL_PAIR.b))
    const rounds = await page.locator('[data-cy="head-to-head-table"] tbody tr td:nth-child(2)').allInnerTexts()
    expect(rounds.map(round => round.trim())).toContain('Poule 2')
    await expect(page.getByTestId('head-to-head-unknown-results')).toHaveCount(0)
    await expect(page.getByTestId('head-to-head-note')).toHaveText(STATIC_NOTE)
  })

  test('G9 : plusieurs rencontres au résultat inconnu, phrase au pluriel avant la note, jamais comptées', async ({ page }) => {
    await hydrated(page, pairUrl(PLURAL_PAIR.a, PLURAL_PAIR.b))
    await expect(page.getByTestId('head-to-head-unknown-results')).toHaveText('2 rencontres au résultat inconnu.')
    await expect(page.getByTestId('head-to-head-note')).toHaveText(`2 rencontres au résultat inconnu. ${STATIC_NOTE}`)
    await expect(page.getByTestId('head-to-head-bar')).toHaveCount(0)
    await expect(page.getByTestId('head-to-head-history-empty')).toBeVisible()
  })

  test('G9 : une rencontre au résultat inconnu, phrase au singulier, à côté d’une rencontre avec score', async ({ page }) => {
    await hydrated(page, pairUrl(SINGULAR_PAIR.a, SINGULAR_PAIR.b))
    await expect(page.getByTestId('head-to-head-note')).toHaveText(`1 rencontre au résultat inconnu. ${STATIC_NOTE}`)
    await expect(page.locator('[data-cy="head-to-head-table"] tbody tr')).toHaveCount(1)
  })
})
