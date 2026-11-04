import { chromium } from '@playwright/test'

const css = process.argv[2] || ':root{}'
const w = Number(process.argv[3] || 1440)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' })
await page.goto('http://localhost:3104/joueurs')
await page.waitForLoadState('networkidle')
await page.addStyleTag({ content: css })
console.log(await page.evaluate(() => {
  const li = document.querySelector('.origam-pagination__item--is-active')
  const b = li.querySelector('button')
  const g = (el, ...p) => p.map(v => `${v}=${getComputedStyle(el).getPropertyValue(v)}`).join('\n')
  const cs = getComputedStyle(b)
  const sheets = []
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText && b.matches(rule.selectorText.replace(/\[data-v-[a-z0-9]+\]/g, '')) && /(^|[^-])color/.test(rule.cssText) && !/background|border-color|outline/.test(rule.cssText.slice(0, 0))) {
          const m = rule.cssText.match(/[^-a-z]color:[^;]*;/g)
          if (m) sheets.push(`${rule.selectorText} -> ${m.join(' ')}`)
        }
      }
    } catch {}
  }
  return [`color=${cs.color}`, g(b, '--origam-btn---color'), sheets.slice(0, 15).join('\n')].join('\n')
}))
await browser.close()
