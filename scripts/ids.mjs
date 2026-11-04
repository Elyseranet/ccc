import { chromium } from '@playwright/test'

const [, , url, id] = process.argv
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url)
await page.waitForLoadState('networkidle')
console.log(await page.evaluate((target) => {
  const el = document.getElementById(target)
  return el ? `${el.tagName} ${el.outerHTML.slice(0, 300)}` : 'NOT FOUND'
}, id))
console.log(await page.evaluate(() => [...document.querySelectorAll('[data-cy=players-search-query] input')].map(i => i.id + ' type=' + i.type + ' aria-label=' + i.getAttribute('aria-label')).join('\n')))
await browser.close()
