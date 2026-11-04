import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const [, , url, width, ...selectors] = process.argv
const PROPS = ['display', 'width', 'height', 'padding', 'margin', 'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing', 'textTransform', 'color', 'backgroundColor', 'border', 'borderRadius', 'boxShadow', 'gap', 'textAlign']
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: Number(width), height: 900 }, reducedMotion: 'reduce' })
const page = await context.newPage()
await page.goto(url.startsWith('http') ? url : `file://${resolve(url)}`)
await page.evaluate(() => document.fonts.ready)
await page.waitForLoadState('networkidle')
for (const selector of selectors) {
  const out = await page.evaluate(({ selector, PROPS }) => {
    const el = document.querySelector(selector)
    if (!el) return 'NOT FOUND'
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return { tag: el.tagName, box: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`, ...Object.fromEntries(PROPS.map(p => [p, cs[p]])) }
  }, { selector, PROPS })
  console.log(selector, JSON.stringify(out))
}
await browser.close()
