import { chromium } from '@playwright/test'

const css = process.argv[2]
const w = Number(process.argv[3] || 1440)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' })
await page.goto('http://localhost:3104/joueurs')
await page.waitForLoadState('networkidle')
await page.addStyleTag({ content: css })
await page.waitForTimeout(300)
console.log(await page.evaluate(() => {
  const el = document.querySelector('[data-cy=players-pagination]')
  const r0 = el.getBoundingClientRect()
  const out = [`root ${r0.x.toFixed(1)},${r0.y.toFixed(1)} ${r0.width.toFixed(1)}x${r0.height.toFixed(1)}`]
  for (const b of el.querySelectorAll('button')) {
    const r = b.getBoundingClientRect(); const cs = getComputedStyle(b)
    out.push(`${b.textContent.trim().slice(0, 10)} | ${r.x.toFixed(1)},${r.y.toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)} bg=${cs.backgroundColor} color=${cs.color} fs=${cs.fontSize} fw=${cs.fontWeight} radius=${cs.borderRadius}`)
  }
  return out.join('\n')
}))
await browser.close()
