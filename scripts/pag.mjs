import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const w = Number(process.argv[2] || 1440)
const target = process.argv[3] || 'app'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' })
await page.goto(target === 'app' ? 'http://localhost:3104/joueurs' : `file://${resolve('docs/design/ui/happy-hour/joueurs.html')}`)
await page.evaluate(() => document.fonts.ready)
await page.waitForLoadState('networkidle')
console.log(await page.evaluate((isApp) => {
  const el = document.querySelector(isApp ? '[data-cy=players-pagination]' : '.pager')
  const r0 = el.getBoundingClientRect()
  const out = [`root ${r0.x.toFixed(1)},${r0.y.toFixed(1)} ${r0.width.toFixed(1)}x${r0.height.toFixed(1)}`]
  if (isApp) out.push(el.outerHTML.replace(/ data-v-[a-z0-9]+=""/g, '').slice(0, 1500))
  for (const b of el.querySelectorAll(isApp ? 'button' : 'a')) {
    const r = b.getBoundingClientRect(); const cs = getComputedStyle(b)
    out.push(`${b.textContent.trim().slice(0, 10)} | ${r.x.toFixed(1)},${r.y.toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)} bg=${cs.backgroundColor} color=${cs.color} fs=${cs.fontSize} fw=${cs.fontWeight} radius=${cs.borderRadius} aria=${b.getAttribute('aria-label')}`)
  }
  return out.join('\n')
}, target === 'app'))
await browser.close()
