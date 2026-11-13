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
 * - PLURAL_PAIR : 2 rencontres d'archive sans score (vainqueur connu, B-21) : 1 victoire, 1 défaite, aucun point ;
 * - SINGULAR_PAIR : 1 rencontre d'archive sans score (B-21) et 1 avec score (6–10).
 * Depuis B-21 (R-5 bis) ces rencontres ne sont plus « au résultat inconnu » : leur vainqueur est affiché avec « score non archivé »
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

  test('B-21 : des rencontres d’archive sans score montrent « score non archivé » et leur vainqueur, sans phrase de résultat inconnu', async ({ page }) => {
    await hydrated(page, pairUrl(PLURAL_PAIR.a, PLURAL_PAIR.b))
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

  test('B-21 : une rencontre avec score et une sans score côte à côte, jamais « 0 – 0 »', async ({ page }) => {
    await hydrated(page, pairUrl(SINGULAR_PAIR.a, SINGULAR_PAIR.b))
    const scores = await page.locator('[data-cy="head-to-head-table"] tbody tr td:nth-child(3)').allInnerTexts()
    expect(scores.map(score => score.trim()).sort()).toEqual(['10 – 6', 'score non archivé'])
    await expect(page.getByTestId('head-to-head-note')).toHaveText(STATIC_NOTE)
  })
})
