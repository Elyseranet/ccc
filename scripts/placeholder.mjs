import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const targets = [
  ['mockup', `file://${resolve('docs/design/ui/happy-hour/joueurs.html')}`, '#q'],
  ['app', 'http://localhost:3104/joueurs', '#players-search-query']
]
const browser = await chromium.launch()
for (const [name, url, selector] of targets) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await page.goto(url)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
  console.log(name, JSON.stringify(await page.evaluate((sel) => {
    const input = document.querySelector(sel)
    const rect = input.getBoundingClientRect()
    const ph = getComputedStyle(input, '::placeholder')
    const cs = getComputedStyle(input)
    return { box: `${rect.x.toFixed(2)},${rect.y.toFixed(2)} ${rect.width.toFixed(2)}x${rect.height.toFixed(2)}`, placeholder: { color: ph.color, opacity: ph.opacity, fontSize: ph.fontSize }, fontSize: cs.fontSize, lineHeight: cs.lineHeight, padding: cs.padding, color: cs.color, wrapper: input.closest('.origam-field') ? input.closest('.origam-field').getBoundingClientRect().y.toFixed(2) : null }
  }, selector)))
  await page.close()
}
await browser.close()
