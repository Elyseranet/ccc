import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const [, , url, width, ...selectors] = process.argv
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 }, reducedMotion: 'reduce' })
await page.goto(url.startsWith('http') ? url : `file://${resolve(url)}`)
await page.evaluate(() => document.fonts.ready)
await page.waitForLoadState('networkidle')
for (const selector of selectors) {
  const out = await page.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0, 4).map((el) => {
    const r = el.getBoundingClientRect()
    return `${r.x.toFixed(2)},${r.y.toFixed(2)} ${r.width.toFixed(2)}x${r.height.toFixed(2)}`
  }), selector)
  console.log(selector, '=>', out.join(' | '))
}
await browser.close()
