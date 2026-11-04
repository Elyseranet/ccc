import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const props = ['-webkit-font-smoothing', 'text-rendering', 'font-kerning', 'font-feature-settings', 'font-variation-settings', 'font-optical-sizing', 'opacity', 'text-shadow', 'font-stretch', 'font-synthesis', 'font-weight', 'font-family', 'color', 'font-style', 'text-transform', 'word-spacing', 'transform', 'filter', 'mix-blend-mode']
const browser = await chromium.launch()
for (const [name, url, sel, ph] of [['mockup', `file://${resolve('docs/design/ui/happy-hour/joueurs.html')}`, '#q', true], ['app', 'http://localhost:3104/joueurs', '#players-search-query', true]]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await page.goto(url)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
  console.log(name, await page.evaluate(({ sel, props }) => {
    const el = document.querySelector(sel)
    const chain = []
    let n = el
    for (let i = 0; i < 4 && n; i++, n = n.parentElement) {
      const cs = getComputedStyle(n)
      chain.push(`${n.tagName}${n.className ? '.' + String(n.className).split(' ')[0] : ''} op=${cs.opacity} filter=${cs.filter} blend=${cs.mixBlendMode}`)
    }
    const cs = getComputedStyle(el); const ph = getComputedStyle(el, '::placeholder')
    return chain.join(' | ') + '\n' + props.map(p => `${p}=${cs.getPropertyValue(p)} [ph ${ph.getPropertyValue(p)}]`).join('\n')
  }, { sel, props }))
  await page.close()
}
await browser.close()
