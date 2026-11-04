import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const [, , url, cssFile, ...selectors] = process.argv
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await page.goto(url)
await page.evaluate(() => document.fonts.ready)
await page.waitForLoadState('networkidle')
if (cssFile !== '-') {
  await page.addStyleTag({ content: readFileSync(cssFile, 'utf8') })
}
for (const selector of selectors) {
  const out = await page.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0, 2).map((el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return `${r.x.toFixed(2)},${r.y.toFixed(2)} ${r.width.toFixed(2)}x${r.height.toFixed(2)} bg=${cs.backgroundColor} border=${cs.borderTopWidth} ${cs.borderTopColor} shadow=${cs.boxShadow.slice(0, 60)} pad=${cs.padding} fs=${cs.fontSize} radius=${cs.borderRadius}`
  }), selector)
  console.log(selector, '=>', out.join(' | '))
}
if (process.env.SHOT) {
  await page.screenshot({ path: process.env.SHOT, clip: { x: 0, y: 380, width: 1440, height: 170 } })
}
await browser.close()
