import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' })
await page.goto('http://localhost:3104/joueurs')
await page.waitForLoadState('networkidle')
console.log(await page.evaluate(() => {
  let el = document.querySelector('#players-search-query'); const out = []
  while (el) {
    const cs = getComputedStyle(el)
    out.push(`${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join('.')} lh=${cs.lineHeight} fs=${cs.fontSize} ls=${cs.letterSpacing}`)
    el = el.parentElement
  }
  const rules = []
  const input = document.querySelector('#players-search-query')
  const walk = (list) => { for (const rule of list) {
    if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules); continue }
    if (!rule.selectorText) continue
    let ok = false; try { ok = input.matches(rule.selectorText) || input.closest(rule.selectorText) } catch {}
    if (ok && /(^|[ ;{])line-height:/.test(rule.cssText)) rules.push(`${rule.selectorText} => ${rule.style.getPropertyValue('line-height')}`)
  } }
  for (const s of document.styleSheets) { try { walk(s.cssRules) } catch {} }
  return out.join('\n') + '\nRULES\n' + rules.join('\n')
}))
await browser.close()
