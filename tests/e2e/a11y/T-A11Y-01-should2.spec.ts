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

/*********************************************************
 * S4 : l'anneau de focus des liens de l'en-tête est dans le lien (décision utilisateur A11Y-S4)
 *
 * @description
 * Mesure du 2026-11-14 : l'anneau d'Origam (trait 2 px, décalage 4 px) sortait de 6 px du lien, que la nav (`overflow-y: auto`) rognait ; à 390 px le header rognait 2 px de plus. L'anneau est maintenant
 * intérieur, comme celui des onglets : décalage négatif, et plus aucune boîte à overflow ne le coupe.
 ********************************************************/
for (const viewport of [{ name: '1440', width: 1440, height: 900 }, { name: '390', width: 390, height: 844 }]) {
  test(`en-tête : l'anneau de focus du lien « Éditions » reste dans le lien, sans rognage @${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/')
    await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
    const link = page.getByTestId('nav-/editions')
    await link.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(link).toBeFocused()
    const clipped = await link.evaluate((element) => {
      const style = getComputedStyle(element)
      const ring = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset)
      const rect = element.getBoundingClientRect()
      const box = { top: rect.top - ring, bottom: rect.bottom + ring, left: rect.left - ring, right: rect.right + ring }
      let worst = 0
      for (let node = element.parentElement; node; node = node.parentElement) {
        const cs = getComputedStyle(node)
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') {
          continue
        }
        const r = node.getBoundingClientRect()
        worst = Math.max(worst, r.top - box.top, box.bottom - r.bottom, r.left - box.left, box.right - r.right)
      }
      return { offset: parseFloat(style.outlineOffset), worst }
    })
    expect(clipped.offset).toBeLessThan(0)
    expect(clipped.worst).toBeLessThanOrEqual(0)
  })
}
