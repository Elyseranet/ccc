import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const [, , url, out, width = '1440', height = '900'] = process.argv
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: Number(width), height: Number(height) }, reducedMotion: 'reduce' })
const page = await context.newPage()
const messages = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) messages.push(`${m.type()}: ${m.text()}`) })
page.on('pageerror', e => messages.push(`pageerror: ${e.message}`))
await page.goto(url.startsWith('http') || url.startsWith('file') ? url : `file://${resolve(url)}`)
await page.evaluate(() => document.fonts.ready)
await page.waitForLoadState('networkidle')
await page.screenshot({ path: out, fullPage: true })
console.log(messages.join('\n'))
await browser.close()
