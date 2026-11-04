import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await page.goto('http://localhost:3104/joueurs')
await page.waitForLoadState('networkidle')
console.log(await page.evaluate(() => {
  const b = document.querySelectorAll('.origam-pagination__item button')[1]
  const out = []
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules); continue }
      if (!rule.selectorText) continue
      let ok = false
      try { ok = b.matches(rule.selectorText) } catch {}
      if (!ok) continue
      for (const prop of ['background-color', 'color']) {
        if (rule.style.getPropertyValue(prop)) out.push(`${rule.selectorText} { ${prop}: ${rule.style.getPropertyValue(prop)} ${rule.style.getPropertyPriority(prop)} }`)
      }
    }
  }
  for (const sheet of document.styleSheets) { try { walk(sheet.cssRules) } catch {} }
  return out.join('\n')
}))
await browser.close()
