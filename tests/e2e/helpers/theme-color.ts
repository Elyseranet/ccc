import type { Page } from '@playwright/test'

/*********************************************************
 * Couleur d'un token du thème, résolue par le navigateur (T-QA-09)
 *
 * @description
 * Les specs comparent une couleur calculée au token du thème, jamais à une valeur codée en dur : un rethème (32c99a70)
 * ne casse plus les tests. Rend la couleur au format de `getComputedStyle` (`rgb(r, g, b)`).
 ********************************************************/
export const themeColor = (page: Page, token: string): Promise<string> => page.evaluate((name) => {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}, token)
