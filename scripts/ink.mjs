import { chromium } from '@playwright/test'
import { resolve } from 'node:path'
import { PNG } from 'pngjs'

const w = Number(process.argv[2] || 1440)
const browser = await chromium.launch()
const targets = [
  ['mockup', `file://${resolve('docs/design/ui/happy-hour/joueurs.html')}`, '#q', 'select.input'],
  ['app', 'http://localhost:3104/joueurs', '#players-search-query', '.origam-select input']
]
const measure = (buffer, x0, y0) => {
  const png = PNG.sync.read(buffer)
  const bg = [png.data[0], png.data[1], png.data[2]]
  let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1, sum = 0, sy = 0, sx = 0
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) * 4
    const d = Math.abs(png.data[i] - bg[0]) + Math.abs(png.data[i + 1] - bg[1]) + Math.abs(png.data[i + 2] - bg[2])
    if (d > 60) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y) }
    sum += d; sy += d * y; sx += d * x
  }
  return `ink x ${x0 + minX}..${x0 + maxX} y ${y0 + minY}..${y0 + maxY} centroid x ${(x0 + sx / sum).toFixed(2)} y ${(y0 + sy / sum).toFixed(2)} mass ${sum}`
}
for (const [name, url, inputSel, selectSel] of targets) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' })
  await page.goto(url)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
  for (const [label, sel] of [['placeholder', inputSel], ['select', selectSel]]) {
    const field = await page.evaluate((s) => {
      const el = document.querySelector(s)
      const f = el.closest('.origam-field') || el
      const r = f.getBoundingClientRect()
      return { fx: r.x, fy: r.y, fh: r.height }
    }, sel)
    const x0 = Math.round(field.fx) + 16, y0 = Math.round(field.fy) + 8, wid = 140, hei = Math.round(field.fh) - 16
    const buffer = await page.screenshot({ clip: { x: x0, y: y0, width: wid, height: hei } })
    console.log(name, label, `field x ${field.fx.toFixed(2)} y ${field.fy.toFixed(2)} h ${field.fh}`, measure(buffer, x0, y0))
  }
  await page.close()
}
await browser.close()
