import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await page.goto(`file://${resolve('docs/design/ui/happy-hour/admin-participants.html')}`)
await page.evaluate(() => document.fonts.ready)
console.log(await page.evaluate(() => [...document.querySelectorAll('.pa-list th, .pa-list tbody tr:first-child td')].map((el) => {
  const r = el.getBoundingClientRect()
  return `${el.tagName} ${el.textContent.trim().slice(0, 12)} x${r.x.toFixed(0)} w${r.width.toFixed(0)} h${r.height.toFixed(0)}`
}).join('\n')))
await browser.close()
