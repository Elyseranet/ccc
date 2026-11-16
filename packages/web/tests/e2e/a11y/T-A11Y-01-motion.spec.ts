import { expect, test } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'
import { MOTION_COOKIE, MOTION_PAUSED_VALUE } from '../../../src/consts/motion.const'
import { E2E_BASE_URL } from '../helpers/e2e.const'

/*********************************************************
 * Pause des animations (T-A11Y-01, M5 ; WCAG 2.2.2, RGAA 13.8)
 *
 * @description
 * Sans cookie `ccc_motion`, les animations en boucle de l'accueil (gouttes, bulles et capsules de la pinte) tournent et le canvas bouge. Avec le
 * cookie (valeur `paused`), le serveur pose `data-motion="paused"` sur `<html>` : les animations en boucle sont à l'état `paused` (calculé), le canvas est
 * immobile, et l'entrée du titre, jouée une seule fois, n'est pas figée. Ces tests tournent sans `prefers-reduced-motion` (le défaut de la
 * configuration, qui le demande, couperait tout).
 ********************************************************/
test.use({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } })

const LOOPING = '.home-pint__drip, .home-pint__bubbles circle, .home-pint__cap'
const CANVAS_SETTLE_MS = 700

const pause = (context: BrowserContext) => context.addCookies([{ name: MOTION_COOKIE, value: MOTION_PAUSED_VALUE, url: E2E_BASE_URL }])

const playStates = (page: Page) => page.evaluate((selector) => Array.from(document.querySelectorAll(selector)).map(element => getComputedStyle(element).animationPlayState), LOOPING)

const canvasMoves = (page: Page) => page.evaluate(async (settle) => {
  const canvas = document.querySelector('canvas') as HTMLCanvasElement
  const before = canvas.toDataURL()
  await new Promise(resolve => setTimeout(resolve, settle))
  return before !== canvas.toDataURL()
}, CANVAS_SETTLE_MS)

test.describe('accueil', () => {
  test('sans le cookie : les animations en boucle et le canvas tournent, le bouton n’est pas appuyé', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const states = await playStates(page)
    expect(states.length).toBeGreaterThan(0)
    expect(states.every(state => state === 'running')).toBe(true)
    expect(await canvasMoves(page)).toBe(true)
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/)
    await expect(page.getByTestId('motion-toggle')).toHaveAttribute('aria-pressed', 'false')
  })

  test('avec le cookie : le HTML part en pause, les animations en boucle sont à « paused », le canvas est immobile, l’entrée du titre n’est pas figée', async ({ page, context }) => {
    await pause(context)
    const html = await (await page.request.get('/')).text()
    expect(html).toMatch(/<html[^>]*data-motion="paused"/)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const states = await playStates(page)
    expect(states.length).toBeGreaterThan(0)
    expect(states.every(state => state === 'paused')).toBe(true)
    expect(await canvasMoves(page)).toBe(false)
    const entry = await page.evaluate(() => document.getAnimations().filter(animation => (animation as CSSAnimation).animationName.startsWith('home-hero-rise')).map(animation => animation.playState))
    expect(entry.length).toBeGreaterThan(0)
    expect(entry.every(state => state !== 'paused')).toBe(true)
    await expect(page.getByTestId('motion-toggle')).toHaveAttribute('aria-pressed', 'true')
  })

  test('le bouton, au clavier : Entrée met en pause et pose le cookie, une seconde fois relance et le retire', async ({ page, context }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const toggle = page.getByTestId('motion-toggle')
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('html')).toHaveAttribute('data-motion', MOTION_PAUSED_VALUE)
    expect((await context.cookies(E2E_BASE_URL)).find(cookie => cookie.name === MOTION_COOKIE)?.value).toBe(MOTION_PAUSED_VALUE)
    expect((await playStates(page)).every(state => state === 'paused')).toBe(true)
    await page.keyboard.press('Space')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/)
    expect((await context.cookies(E2E_BASE_URL)).find(cookie => cookie.name === MOTION_COOKIE)).toBeUndefined()
    expect((await playStates(page)).every(state => state === 'running')).toBe(true)
  })
})

test.describe('palmarès', () => {
  test('sans le cookie le canvas bouge, avec le cookie il est immobile', async ({ page, context }) => {
    await page.goto('/palmares')
    await page.waitForLoadState('networkidle')
    expect(await canvasMoves(page)).toBe(true)
    await pause(context)
    await page.reload()
    await page.waitForLoadState('networkidle')
    expect(await canvasMoves(page)).toBe(false)
    await expect(page.getByTestId('motion-toggle')).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('prefers-reduced-motion : reduce', () => {
  test.use({ reducedMotion: 'reduce' })

  test('le bouton est masqué (rien ne bouge)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('motion-toggle')).toBeHidden()
  })
})
