import { chromium } from '@playwright/test'

const [, , url, selector, ...vars] = process.argv
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await page.goto(url)
await page.waitForLoadState('networkidle')
console.log(await page.evaluate(({ selector, vars }) => {
  const el = document.querySelector(selector)
  const cs = getComputedStyle(el)
  const root = getComputedStyle(document.documentElement)
  return `${el.outerHTML.slice(0, 500)}\n${vars.map(v => `${v}: el=${cs.getPropertyValue(v)} root=${root.getPropertyValue(v)}`).join('\n')}`
}, { selector, vars }))
await browser.close()
