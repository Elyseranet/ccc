import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:3104/joueurs')
await page.waitForLoadState('networkidle')
console.log((await page.evaluate(() => {
  const out = []
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule.cssRules && !(rule instanceof CSSStyleRule)) { walk(rule.cssRules); continue }
      if (rule.selectorText && rule.selectorText.includes('placeholder')) out.push(`${rule.selectorText} { ${rule.style.cssText.slice(0, 120)} }`)
    }
  }
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules) } catch { /* feuille externe */ }
  }
  return out
})).join('\n'))
await browser.close()
