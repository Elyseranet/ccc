import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { expect } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

/*********************************************************
 * Comparaison visuelle maquette / application (FA-04)
 *
 * @description
 * Mesure l'écart de pixels entre les maquettes `docs/design/ui/happy-hour/*.html` et l'application, sur les zones
 * de coque (en-tête, pied de page, tiroir admin, barre haute admin, barre basse admin), à 1440 et 390 px.
 * Seuil FA-04 validé par l'utilisateur : 1 % de pixels par zone (`VISUAL_MAX_DIFF_RATIO` ne peut que le surcharger),
 * en plus d'une relecture humaine de l'image d'écart (`visual-results/<zone>-<viewport>-ecart.png`) avant merge.
 * La note « Maquette haute fidélité… » du pied de page de la maquette est un artefact : elle est exclue de la découpe.
 * La boîte de saisie de score ouverte (`.sheet`, `.sheet-scrim`) de admin-matchs.html est masquée : elle recouvre la coque.
 * ARCH-9 : l'application tourne sur les vraies données. Les zones de DONNÉES (édition choisie, initiales du compte…)
 * sont masquées des deux côtés par un aplat de même couleur (`DATA_MASK_COLOR`) : le pixel perfect ne porte que sur
 * les zones fixes (structure, gabarits, en-tête, pied, typographie). Seuil inchangé : 1 % par zone.
 ********************************************************/
export const MOCKUP_DIR = resolve('docs/design/ui/happy-hour')
export const OUTPUT_DIR = resolve('visual-results')
const PIXELMATCH_THRESHOLD = 0.1
const DEFAULT_MAX_DIFF_RATIO = 0.01
const MAX_DIFF_RATIO = process.env.VISUAL_MAX_DIFF_RATIO ? Number(process.env.VISUAL_MAX_DIFF_RATIO) : DEFAULT_MAX_DIFF_RATIO

export interface IClip { x: number, y: number, width: number, height: number }

/**
 * Sélecteurs des zones de données à masquer, côté maquette et côté application.
 * `mockup` / `app` : l'élément entier est masqué. `values` : seule la valeur affichée d'un champ est masquée (aplat
 * posé dans la boîte du champ, entre le padding gauche et le chevron), si bien que filet, rayon, fond et chevron
 * restent dans la comparaison (F-14, M1).
 */
export interface IDataMasks { mockup: string[], app: string[], values?: { mockup: string[], app: string[] } }

/** Marges de l'aplat de valeur dans la boîte du champ : padding gauche + filet, padding droit + filet, bords haut et bas. */
const VALUE_MASK_INSETS = { left: 21, right: 41, vertical: 6 }

/** Aplat des zones masquées : identique des deux côtés, il ne compte donc pas dans l'écart. */
const DATA_MASK_COLOR = '#FF00FF'

/** Barre haute admin : sélecteur d'édition (liste réelle des éditions) et initiales du compte connecté. */
export const ADMIN_TOP_DATA_MASKS: IDataMasks = {
  mockup: ['.adm-top .avatar'],
  app: ['[data-cy="admin-avatar"]'],
  values: { mockup: ['.adm-top select'], app: ['.admin-top .admin-edition-select'] }
}

/** Carte « Édition active » de la page Plus : sélecteur d'édition. */
export const PLUS_EDITION_DATA_MASKS: IDataMasks = {
  mockup: [],
  app: [],
  values: { mockup: ['.plus-ed select'], app: ['.admin-more__edition .admin-edition-select'] }
}

const NO_MASKS: IDataMasks = { mockup: [], app: [] }

export const settle = async (page: Page) => {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
  await page.addStyleTag({ content: '*, *::before, *::after { caret-color: transparent !important; } canvas.bubbles { display: none !important; } .sheet-scrim, .sheet { display: none !important; }' })
}

export const box = async (page: Page, selector: string): Promise<IClip> => {
  const found = await page.locator(selector).first().boundingBox()
  if (!found) {
    throw new Error(`Élément introuvable : ${selector}`)
  }
  return found
}

const addValueMasks = async (target: Page, selectors: string[]) => {
  for (const selector of selectors) {
    await target.locator(selector).first().evaluate((element, config) => {
      const rect = element.getBoundingClientRect()
      const veil = document.createElement('div')
      veil.setAttribute('data-visual-value-mask', '')
      veil.style.cssText = `position:absolute;pointer-events:none;z-index:2147483647;background:${config.color};left:${rect.left + window.scrollX + config.insets.left}px;top:${rect.top + window.scrollY + config.insets.vertical}px;width:${rect.width - config.insets.left - config.insets.right}px;height:${rect.height - 2 * config.insets.vertical}px`
      document.body.appendChild(veil)
    }, { color: DATA_MASK_COLOR, insets: VALUE_MASK_INSETS })
  }
}

const removeValueMasks = async (target: Page) => {
  await target.evaluate(() => document.querySelectorAll('[data-visual-value-mask]').forEach(node => node.remove()))
}

export const compare = async (page: Page, mockup: Page, name: string, viewport: string, mockClip: IClip, appClip: IClip, masks: IDataMasks = NO_MASKS) => {
  mkdirSync(OUTPUT_DIR, { recursive: true })
  await addValueMasks(mockup, masks.values?.mockup ?? [])
  await addValueMasks(page, masks.values?.app ?? [])
  const mockBuffer = await mockup.screenshot({ clip: mockClip, fullPage: true, mask: masks.mockup.map(selector => mockup.locator(selector)), maskColor: DATA_MASK_COLOR })
  const appBuffer = await page.screenshot({ clip: appClip, fullPage: true, mask: masks.app.map(selector => page.locator(selector)), maskColor: DATA_MASK_COLOR })
  await removeValueMasks(mockup)
  await removeValueMasks(page)
  writeFileSync(join(OUTPUT_DIR, `${name}-${viewport}-maquette.png`), mockBuffer)
  writeFileSync(join(OUTPUT_DIR, `${name}-${viewport}-app.png`), appBuffer)
  const a = PNG.sync.read(mockBuffer)
  const b = PNG.sync.read(appBuffer)
  const size = `${a.width}x${a.height} / ${b.width}x${b.height}`
  const width = Math.max(a.width, b.width)
  const height = Math.max(a.height, b.height)
  const pad = (png: PNG): PNG => {
    const out = new PNG({ width, height })
    PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0)
    return out
  }
  const left = pad(a)
  const right = pad(b)
  const diff = new PNG({ width, height })
  const diffPixels = pixelmatch(left.data, right.data, diff.data, width, height, { threshold: PIXELMATCH_THRESHOLD })
  writeFileSync(join(OUTPUT_DIR, `${name}-${viewport}-ecart.png`), PNG.sync.write(diff))
  const ratio = diffPixels / (width * height)
  writeFileSync(join(OUTPUT_DIR, `${name}-${viewport}.json`), JSON.stringify({ zone: name, viewport, size, diffPixels, totalPixels: width * height, ratio: Number(ratio.toFixed(6)) }))
  console.log(`ECART ${name} @${viewport} : ${(ratio * 100).toFixed(3)} % (${diffPixels} / ${width * height} px, ${size})`)
  expect.soft(ratio, `${name} @${viewport}`).toBeLessThanOrEqual(MAX_DIFF_RATIO)
}

export const open = async (page: Page, browser: Browser, viewport: { width: number, height: number }, mockupFile: string, route: string) => {
  const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  const mockup = await mockContext.newPage()
  await mockup.goto(`file://${MOCKUP_DIR}/${mockupFile}`)
  await settle(mockup)
  await page.goto(route)
  await settle(page)
  return { mockup, mockContext }
}
