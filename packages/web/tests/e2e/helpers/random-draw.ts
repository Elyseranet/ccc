import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { attachParticipant, createCompetitor, createRegistrationEdition } from './edition-write'
import type { IWriteEdition } from './edition-write'

/*********************************************************
 * Aides communes des specs F-52 (tirage au sort et écran projecteur)
 *
 * @description
 * 20 inscrits : la table « Config poules » (RG16) propose 4 poules de 5. Un nouvel inscrit n'a pas de points ACP : toutes les têtes de série sont à égalité
 * sur la frontière (RG10), l'écran demande donc à l'administrateur de les choisir.
 ********************************************************/
export const POOL_PLAYER_COUNT = 20
export const POOL_COUNT = 4

export const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
}

export const poolEdition = async (page: Page, label: string): Promise<IWriteEdition> => {
  const { edition } = await createRegistrationEdition(page.context().request, label)
  for (let index = 1; index < POOL_PLAYER_COUNT; index += 1) {
    const competitor = await createCompetitor(page.context().request, `${label} ${index}`, { lastName: `Joueur ${String(index).padStart(2, '0')}` })
    await attachParticipant(page.context().request, edition, competitor)
  }
  return edition
}

export const reachPoolEntry = async (page: Page) => {
  await page.goto('/admin/tirages')
  await hydrated(page)
  await expect(page.getByTestId('draw-pool-count').locator('input')).toHaveValue(String(POOL_COUNT))
  await page.getByTestId('draw-parameters-next').click()
  await expect(page.getByTestId('draw-seeds')).toBeVisible()
  for (const tie of await page.getByTestId('draw-seed-tie').all()) {
    const needed = Number(await tie.getAttribute('data-needed') ?? '0')
    const boxes = tie.locator('[data-cy^="draw-seed-choice-"] input[type="checkbox"]')
    for (let index = 0; index < needed; index += 1) {
      await boxes.nth(index).check()
    }
  }
  await page.getByTestId('draw-seeds-confirm').click()
  await expect(page.getByTestId('draw-assignment')).toBeVisible()
}

