import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createTiedPoolsEdition, selectAdminEdition } from '../helpers/edition-write'
import { alignToPixel } from '../helpers/home-visual'
import { signIn } from '../helpers/session'
import { alignMockupText, compare, MOCKUP_DIR, settle } from '../visual.util'
import type { IClip } from '../visual.util'

/*********************************************************
 * F-39 : états des étapes du centre de contrôle (admin.html, section « États des étapes », F39-STEPS)
 *
 * @description
 * Pourquoi `writes/` : l'état se mesure sur une édition créée par le test (QA-3, jamais 2026) dont les neuf étapes sont dans l'état de la maquette : étapes 1 à 3 faites, l'étape 4
 * (« Matchs de poules ») en cours, les suivantes à venir, la clôture sans page. Le repos de la zone « centre » est comparé par `visual/F-07.spec.ts`. Ici : survol (indicateur à 85 %),
 * focus clavier (contour 2 px `action.primary.bg`, décalé de 2 px), étape en cours (inerte) et étape sans page. Les textes (titres, sous-titres, nombres) sont recopiés de l'application
 * dans la maquette ; l'état est forcé côté application (survol réel, focus clavier réel) et par `is-hover` / `is-focus` côté maquette. La capture déborde de 6 px pour garder le contour.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]
const PAGE = '/admin'
const STEPS = '[data-cy="admin-control-center-steps"]'
const OUTLINE_MARGIN = 6

interface IStateZone {
  name: string
  /** Rang (1) de l'étape dans la liste de démonstration de la maquette. */
  demo: number
  /** Index de l'étape dans l'application (`stepper-item-{index}`). */
  appIndex: number
  state: 'hover' | 'focus' | 'rest'
}

const ZONES: IStateZone[] = [
  { name: 'etape-survol', demo: 1, appIndex: 1, state: 'hover' },
  { name: 'etape-courante', demo: 2, appIndex: 3, state: 'rest' },
  { name: 'etape-focus', demo: 3, appIndex: 4, state: 'focus' },
  { name: 'etape-sans-page', demo: 4, appIndex: 8, state: 'rest' }
]

const grow = (clip: IClip): IClip => ({ x: clip.x - OUTLINE_MARGIN, y: clip.y - OUTLINE_MARGIN, width: clip.width + 2 * OUTLINE_MARGIN, height: clip.height + 2 * OUTLINE_MARGIN })

const rectOf = async (page: Page, selector: string): Promise<IClip> => {
  const box = await page.locator(selector).first().boundingBox()
  if (!box) {
    throw new Error(`Élément introuvable : ${selector}`)
  }
  return box
}

for (const viewport of VIEWPORTS) {
  test.describe(`F-39 états des étapes @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser, context }) => {
        await signIn(context, 'admin')
        const { edition } = await createTiedPoolsEdition(context.request, `f39${zone.name.slice(6, 9)}${viewport.name}`, 3)
        await selectAdminEdition(context, edition)
        const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
        const mockup = await mockContext.newPage()
        await mockup.goto(`file://${MOCKUP_DIR}/admin.html`)
        await settle(mockup)
        await page.goto(PAGE)
        await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
        await page.getByTestId('admin-control-center').waitFor()
        await settle(page)
        await mockup.addStyleTag({ content: '.adm-bottom { display: none !important; }' })
        await page.addStyleTag({ content: '.admin-bottom { display: none !important; }' })
        const appItem = `${STEPS} [data-cy="stepper-item-${zone.appIndex}"]`
        const demoItem = `.st-demo li:nth-child(${zone.demo})`
        await alignMockupText(mockup, page, [
          { mockup: `${demoItem} .st__b b`, app: `${appItem} .origam-stepper-item__title` },
          { mockup: `${demoItem} .st__b small`, app: `${appItem} .origam-stepper-item__subtitle` }
        ])
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await alignToPixel(mockup, `${demoItem} .st__a`)
        await alignToPixel(page, appItem)
        if (zone.state === 'hover') {
          await page.hover(appItem)
        } else if (zone.state === 'focus') {
          await page.locator(appItem).focus()
          await page.keyboard.press('Shift+Tab')
          await page.keyboard.press('Tab')
        }
        await page.waitForTimeout(400)
        const mockClip = grow(await rectOf(mockup, `${demoItem} .st__a`))
        const appClip = grow(await rectOf(page, appItem))
        await compare(page, mockup, `etape-${zone.name.slice(6)}`, viewport.name, mockClip, appClip)
        await mockContext.close()
      })
    }
  })
}
