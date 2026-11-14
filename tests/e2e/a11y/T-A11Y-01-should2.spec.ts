import { expect, test } from '@playwright/test'

/*********************************************************
 * T-A11Y-01 SHOULD, lot 2 : S2 (résultat du face-à-face annoncé, WCAG 4.1.3)
 *
 * @description
 * Mesure du 2026-11-14 : après le choix de deux joueurs, aucune région live ne portait le résultat (seule la région vide « Choisissez deux joueurs » disparaissait). La région
 * `role=status` de la page est maintenant toujours présente, vide avant le choix, et son texte change quand le résultat arrive. Données : les archives de la base de test (ARCH-9).
 ********************************************************/
test('face-à-face : la région role=status annonce le résultat une fois les deux joueurs choisis', async ({ page }) => {
  await page.goto('/joueurs/face-a-face')
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  const region = page.getByTestId('head-to-head-announcement')
  await expect(region).toHaveAttribute('role', 'status')
  await expect(region).toHaveAttribute('aria-live', 'polite')
  await expect(region).toHaveText('')
  const choose = async (side: string, name: string) => {
    const input = page.getByTestId(`head-to-head-player-${side}`).locator('input')
    await input.click()
    await input.fill(name.split(' ')[1]!)
    await page.getByRole('option', { name }).first().click()
  }
  await choose('a', 'Clément Fossati')
  await choose('b', 'Nicolas Deseine')
  await expect(page.getByTestId('head-to-head-duel')).toBeVisible()
  await expect(region).toHaveText('Face-à-face : 2 victoires de Clément Fossati, 2 victoires de Nicolas Deseine.')
})
