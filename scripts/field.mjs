import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const w = Number(process.argv[2] || 1440)
const browser = await chromium.launch()
const targets = [
  ['mockup', `file://${resolve('docs/design/ui/happy-hour/joueurs.html')}`, '#q', 'select.input'],
  ['app', 'http://localhost:3104/joueurs', '#players-search-query', '.players-search__edition input, [data-cy="players-edition"] input, .origam-select input']
]
for (const [name, url, inputSel, selectSel] of targets) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' })
  await page.goto(url)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
  const res = await page.evaluate(({ inputSel, selectSel, isApp }) => {
    const pick = (el) => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const ph = getComputedStyle(el, '::placeholder')
      return {
        box: `${r.x.toFixed(2)},${r.y.toFixed(2)} ${r.width.toFixed(2)}x${r.height.toFixed(2)}`,
        font: `${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily.slice(0, 20)} w${cs.fontWeight} ls${cs.letterSpacing}`,
        padding: cs.padding, margin: cs.margin, border: cs.borderWidth, display: cs.display, alignSelf: cs.alignSelf, verticalAlign: cs.verticalAlign, boxSizing: cs.boxSizing, textIndent: cs.textIndent,
        ph: `${ph.fontSize} ${ph.lineHeight} ${ph.color}`
      }
    }
    const out = {}
    const input = document.querySelector(inputSel)
    out.input = pick(input)
    if (isApp) {
      let el = input.parentElement; const chain = []
      while (el && !el.classList.contains('origam-field') && chain.length < 6) { chain.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} ${JSON.stringify(((r) => `${r.y.toFixed(2)} h${r.height.toFixed(2)}`)(el.getBoundingClientRect()))} lh=${getComputedStyle(el).lineHeight} pad=${getComputedStyle(el).padding} disp=${getComputedStyle(el).display} ai=${getComputedStyle(el).alignItems}`); el = el.parentElement }
      if (el) chain.push(`FIELD ${el.className} ${JSON.stringify(((r) => `${r.y.toFixed(2)} h${r.height.toFixed(2)}`)(el.getBoundingClientRect()))} lh=${getComputedStyle(el).lineHeight} pad=${getComputedStyle(el).padding} disp=${getComputedStyle(el).display}`)
      out.chain = chain
    }
    const sel = document.querySelector(selectSel)
    if (sel) out.select = pick(sel)
    // texte : rectangle du premier caractere via Range sur la valeur (select/ input non accessible) -> on mesure la ligne de base avec un span fantome
    return out
  }, { inputSel, selectSel, isApp: name === 'app' })
  console.log(name, JSON.stringify(res, null, 1))
  await page.close()
}
await browser.close()
