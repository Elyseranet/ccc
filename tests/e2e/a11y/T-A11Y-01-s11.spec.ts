import { expect, test } from '@playwright/test'

/*********************************************************
 * T-A11Y-01 S11 : le focus clavier ne passe pas sous l'en-tête collant (WCAG 2.4.11)
 *
 * @description
 * Mesure du 2026-11-14 : en Maj+Tab sur /palmares et /joueurs, le navigateur remettait l'élément focalisé au bord du viewport, sous l'en-tête `sticky` (76 px à 1440, 110 px à 390).
 * `:focus-visible { scroll-margin-top }` (variable `--public-header---offset`) réserve la hauteur de l'en-tête pour l'élément focalisé seulement (une règle sur `html` décalait la capture du bracket).
 * Le test parcourt la page de bas en haut et refuse tout contrôle (hors en-tête) dont la partie visible est recouverte par l'en-tête.
 ********************************************************/
const VIEWPORTS = [{ name: '1440', width: 1440, height: 900 }, { name: '390', width: 390, height: 844 }]
const STOPS = 60

for (const viewport of VIEWPORTS) {
  for (const route of ['/palmares', '/joueurs']) {
    test(`Maj+Tab sur ${route} @${viewport.name} : aucun contrôle sous l'en-tête`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(route)
      await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
      await page.locator('footer a').last().focus()
      const hidden: string[] = []
      for (let i = 0; i < STOPS; i++) {
        await page.keyboard.press('Shift+Tab')
        const state = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement
          const header = document.querySelector('.public-shell__header')
          if (!header || header.contains(el) || el === document.body) {
            return null
          }
          const r = el.getBoundingClientRect()
          const x0 = Math.max(r.left, 0), x1 = Math.min(r.right, innerWidth), y0 = Math.max(r.top, 0), y1 = Math.min(r.bottom, innerHeight)
          if (r.height > 400 || x1 <= x0 || y1 <= y0) {
            return null
          }
          let covered = 0
          for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
            const hit = document.elementFromPoint(x0 + (x1 - x0) * (a + 0.5) / 5, y0 + (y1 - y0) * (b + 0.5) / 5)
            if (hit && header.contains(hit)) {
              covered++
            }
          }
          return covered === 0 ? null : `${el.tagName.toLowerCase()}[${el.getAttribute('data-cy') ?? ''}] top=${Math.round(r.top)} couvert=${covered}/25`
        })
        if (state) {
          hidden.push(state)
        }
      }
      expect(hidden).toEqual([])
    })
  }
}
