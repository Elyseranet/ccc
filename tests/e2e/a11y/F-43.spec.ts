import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/*********************************************************
 * F-43 : le bouton d'une alerte (texte, filet, anneau de focus) a la couleur de texte de l'alerte
 *
 * @description
 * Mesure du 2026-11-14 : filet 1,02:1 et anneau de focus 1,32:1 sur le fond d'une alerte d'erreur (seuil 3:1, WCAG 1.4.11) ; le texte était à 6,06:1 sauf « Vérifier l'état » de la clôture (2,27:1, couleur
 * crème posée en prop). Une règle `.origam-alert` de `main.css` donne à tout bouton ou lien d'alerte la couleur de texte de l'alerte (~6:1). Le test lit les couleurs calculées d'un bouton « Réessayer » réel
 * (alerte d'erreur de `AsyncState`, API en 500 lors d'une navigation côté client) et calcule les contrastes.
 ********************************************************/
const contrast = (page: Page, selector: string) => page.evaluate((sel) => {
  const parse = (value: string): number[] => { const m = value.match(/[\d.]+/g)!.map(Number); return [m[0]!, m[1]!, m[2]!, m[3] ?? 1] }
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const lum = (c: number[]) => 0.2126 * lin(c[0]!) + 0.7152 * lin(c[1]!) + 0.0722 * lin(c[2]!)
  const ratio = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
  const button = document.querySelector(sel) as HTMLElement
  const alert = button.closest('.origam-alert') as HTMLElement
  const status = getComputedStyle(alert).getPropertyValue('--origam-alert---background-color') || ''
  void status
  const probe = document.createElement('div')
  probe.style.color = 'var(--origam-color__feedback--danger---bg)'
  document.body.appendChild(probe)
  const bg = parse(getComputedStyle(probe).color)
  probe.remove()
  const cs = getComputedStyle(button)
  return { text: ratio(parse(cs.color), bg), border: ratio(parse(cs.borderTopColor), bg), outline: ratio(parse(cs.outlineColor), bg), borderWidth: parseFloat(cs.borderTopWidth) }
}, selector)

for (const viewport of [{ name: '1440', width: 1440, height: 900 }, { name: '390', width: 390, height: 844 }]) {
  test(`bouton d'une alerte d'erreur : texte >= 4,5:1, filet et anneau de focus >= 3:1 @${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.route(/\/api\/v1\/(?!health)/, route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ statusCode: 500, message: 'x' }) }))
    await page.goto('/')
    await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
    await page.evaluate(async () => { await (window as unknown as { useNuxtApp: () => { $router: { push: (to: string) => Promise<unknown> } } }).useNuxtApp().$router.push('/palmares') })
    const retry = page.getByTestId('async-state-retry')
    await retry.waitFor()
    const rest = await contrast(page, '[data-cy="async-state-retry"]')
    expect(rest.text).toBeGreaterThanOrEqual(4.5)
    expect(rest.borderWidth).toBeGreaterThan(0)
    expect(rest.border).toBeGreaterThanOrEqual(3)
    await retry.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(retry).toBeFocused()
    expect((await contrast(page, '[data-cy="async-state-retry"]')).outline).toBeGreaterThanOrEqual(3)
  })
}
