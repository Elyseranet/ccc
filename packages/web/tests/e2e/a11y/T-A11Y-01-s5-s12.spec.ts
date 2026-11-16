import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/*********************************************************
 * T-A11Y-01 S5 (reflow à 320 px, WCAG 1.4.10) et S12 (espacement du texte, WCAG 1.4.12)
 *
 * @description
 * Mesure du 2026-11-14 : `body` est en `overflow-x: clip`, donc `scrollWidth` seul masque le défaut ; le test regarde la géométrie des éléments : aucun élément ne dépasse le viewport hors d'un
 * conteneur à défilement horizontal (tableaux, onglets, bracket : contenus à deux dimensions autorisés). Pour S12, les valeurs de 1.4.12 (interligne 1,5, lettres 0,12 em, mots 0,16 em, paragraphes 2 em) sont
 * injectées et aucun élément `overflow: hidden / clip` ne doit couper un texte qu'il ne coupait pas avant.
 ********************************************************/
const SPACING = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }'

const hydrated = (page: Page) => page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)

const outsideViewport = (page: Page) => page.evaluate(() => {
  const vw = document.documentElement.clientWidth
  const scrolls = (el: Element): boolean => {
    for (let node = el.parentElement; node && node !== document.documentElement; node = node.parentElement) {
      if (['auto', 'scroll'].includes(getComputedStyle(node).overflowX)) {
        return true
      }
    }
    return false
  }
  return [...document.querySelectorAll('body *')]
    .filter((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && getComputedStyle(el).position !== 'fixed' && (r.right > vw + 1 || r.left < -1) && !scrolls(el)
    })
    .slice(0, 8)
    .map(el => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} droite=${Math.round(el.getBoundingClientRect().right)}`)
})

const clippedTexts = (page: Page) => page.evaluate(() => [...document.querySelectorAll('body *')].flatMap((el) => {
  const cs = getComputedStyle(el)
  const clips = (value: string) => ['hidden', 'clip'].includes(value)
  const node = el as HTMLElement
  if (node.offsetWidth === 0 || (node.textContent ?? '').trim() === '') {
    return []
  }
  const horizontal = clips(cs.overflowX) && node.scrollWidth > node.clientWidth + 1
  const vertical = clips(cs.overflowY) && node.scrollHeight > node.clientHeight + 1
  return horizontal || vertical ? [`${el.tagName.toLowerCase()}.${String(el.className).split(' ').filter(Boolean).slice(0, 2).join('.')}`] : []
}))

test('S5 : /regles à 320 x 256, aucun élément hors du viewport hors conteneur à défilement', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 })
  await page.goto('/regles')
  await hydrated(page)
  expect(await outsideViewport(page)).toEqual([])
})

test('S12 : /editions/2025 à 390 px avec l’espacement du texte, la pastille de statut ne coupe pas son texte', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/editions/2025')
  await hydrated(page)
  const before = await clippedTexts(page)
  await page.addStyleTag({ content: SPACING })
  await page.waitForTimeout(300)
  const after = await clippedTexts(page)
  const added = after.filter(item => !before.includes(item))
  expect(added).toEqual([])
  const chip = await page.locator('[data-cy="edition-meta"] .origam-chip__content').first().evaluate(el => (el as HTMLElement).scrollWidth - (el as HTMLElement).clientWidth)
  expect(chip).toBeLessThanOrEqual(1)
})

const titleLines = (page: Page) => page.evaluate(() => [...document.querySelectorAll('.home-hero__title span')].map((span) => {
  const range = document.createRange()
  range.selectNodeContents(span)
  return new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size
}))

test('S5 : l’accueil à 320 x 256, rien ne dépasse et le titre se coupe aux syllabes', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 })
  await page.goto('/')
  await hydrated(page)
  expect(await outsideViewport(page)).toEqual([])
  const title = page.locator('.home-hero__title')
  expect(await title.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
  expect(await title.evaluate(el => getComputedStyle(el).hyphens)).toBe('auto')
})

test('S12 : l’accueil à 390 px avec l’espacement du texte, rien ne dépasse ni n’est coupé', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await hydrated(page)
  const before = await clippedTexts(page)
  await page.addStyleTag({ content: SPACING })
  await page.waitForTimeout(300)
  expect(await outsideViewport(page)).toEqual([])
  expect((await clippedTexts(page)).filter(item => !before.includes(item))).toEqual([])
})

for (const width of [1440, 1200, 1000]) {
  test(`décision A11Y-S5-S12-HERO : le titre de l’accueil ne se coupe pas à ${width} px (césure limitée à 760 px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await hydrated(page)
    expect(await page.locator('.home-hero__title').evaluate(el => getComputedStyle(el).hyphens)).toBe('manual')
    expect(await titleLines(page)).toEqual([1, 1])
  })
}
