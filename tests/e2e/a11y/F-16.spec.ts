import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { pairUrl } from '../helpers/head-to-head'

/*********************************************************
 * F-16 : face-à-face, G10 (« Poule n » dans la colonne Tour) et G9 (résultats inconnus de la paire)
 *
 * @description
 * Données réelles de la base de test (ARCH-9), paires trouvées dans l'API des face-à-face :
 * - POOL_PAIR : une rencontre de poule (poule 2), aucun résultat inconnu ;
 * - PLURAL_PAIR : 2 rencontres d'archive sans score (avant B-21 : résultat inconnu ; depuis : vainqueur connu, 1 victoire, 1 défaite, aucun point) ;
 * - SINGULAR_PAIR : 1 rencontre d'archive sans score et 1 avec score (6–10).
 * Les deux états sont couverts (l'API dit lequel : `unknownResults > 0` avant B-21). Depuis B-21 (R-5 bis) ces rencontres ne sont plus « au résultat inconnu » : leur vainqueur est affiché avec « score non archivé »
 * et la phrase des résultats inconnus (G9) ne s'affiche plus sur les archives (comptée à 0), mais reste couverte en test de composant.
 ********************************************************/
const POOL_PAIR = { a: '09f94f14-e46c-4280-8772-567398d8f1b2', b: 'e5836fbc-7b09-46b4-8ea2-f334e4aa76fc' }
const PLURAL_PAIR = { a: '0c1bf0d4-443d-46e2-b6f9-2eab5fd41cb5', b: '720a2ba5-bdf4-4609-953a-48c40470bc74' }
const SINGULAR_PAIR = { a: '09f94f14-e46c-4280-8772-567398d8f1b2', b: '504abe67-a3c4-401f-b5d8-2ea7506c4bef' }
const MOCKUP_FILE = resolve('docs/design/ui/happy-hour/face-a-face.html')
const MOCKUP_NOTE = /<p class="muted pool-note ff-note">([^<]+)<\/p>/.exec(readFileSync(MOCKUP_FILE, 'utf8'))?.[1]?.trim() ?? ''
const STATIC_NOTE = MOCKUP_NOTE

const hydrated = async (page: Page, url: string) => {
  await page.goto(url)
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
}

test.describe('face-à-face : G10 et G9 sur les vraies données', () => {
  test('la note statique de la maquette est lisible', () => {
    expect(MOCKUP_NOTE).toContain('jamais comme des nuls')
  })

  test('G10 : un match de poule affiche « Poule n » dans la colonne Tour', async ({ page }) => {
    await hydrated(page, pairUrl(POOL_PAIR.a, POOL_PAIR.b))
    const rounds = await page.locator('[data-cy="head-to-head-table"] tbody tr td:nth-child(2)').allInnerTexts()
    expect(rounds.map(round => round.trim())).toContain('Poule 2')
    await expect(page.getByTestId('head-to-head-unknown-results')).toHaveCount(0)
    await expect(page.getByTestId('head-to-head-note')).toHaveText(STATIC_NOTE)
  })

  const isBeforeB21 = async (page: Page, pair: { a: string, b: string }): Promise<boolean> => {
    const comparison = await (await page.request.get(`/api/v1/competiteurs/${pair.a}/face-a-face`, { params: { adversaire: pair.b } })).json() as { unknownResults: number }
    return comparison.unknownResults > 0
  }

  test('rencontres d’archive sans score : avant B-21 « résultat inconnu » au pluriel, depuis B-21 « score non archivé » et le vainqueur', async ({ page }) => {
    const before = await isBeforeB21(page, PLURAL_PAIR)
    await hydrated(page, pairUrl(PLURAL_PAIR.a, PLURAL_PAIR.b))
    if (before) {
      await expect(page.getByTestId('head-to-head-unknown-results')).toHaveText('2 rencontres au résultat inconnu.')
      await expect(page.getByTestId('head-to-head-note')).toHaveText(`2 rencontres au résultat inconnu. ${STATIC_NOTE}`)
      await expect(page.getByTestId('head-to-head-bar')).toHaveCount(0)
      await expect(page.getByTestId('head-to-head-history-empty')).toBeVisible()
      return
    }
    const rows = page.locator('[data-cy="head-to-head-table"] tbody tr')
    await expect(rows).toHaveCount(2)
    for (const row of await rows.all()) {
      await expect(row.locator('td').nth(2)).toHaveText('score non archivé')
      await expect(row.locator('td').nth(3)).not.toHaveText('')
    }
    await expect(page.getByTestId('head-to-head-unknown-results')).toHaveCount(0)
    await expect(page.getByTestId('head-to-head-note')).toHaveText(STATIC_NOTE)
    await expect(page.getByTestId('head-to-head-history-empty')).toHaveCount(0)
  })

  test('une rencontre d’archive sans score à côté d’une rencontre avec score : avant B-21 au singulier, depuis B-21 jamais « 0 – 0 »', async ({ page }) => {
    const before = await isBeforeB21(page, SINGULAR_PAIR)
    await hydrated(page, pairUrl(SINGULAR_PAIR.a, SINGULAR_PAIR.b))
    if (before) {
      await expect(page.getByTestId('head-to-head-note')).toHaveText(`1 rencontre au résultat inconnu. ${STATIC_NOTE}`)
      await expect(page.locator('[data-cy="head-to-head-table"] tbody tr')).toHaveCount(1)
      return
    }
    const scores = await page.locator('[data-cy="head-to-head-table"] tbody tr td:nth-child(3)').allInnerTexts()
    expect(scores.map(score => score.trim()).sort()).toEqual(['10 – 6', 'score non archivé'])
    await expect(page.getByTestId('head-to-head-note')).toHaveText(STATIC_NOTE)
  })
})
