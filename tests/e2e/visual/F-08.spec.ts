import { test } from '@playwright/test'
import { signIn } from '../helpers/session'
import { alignToPixel } from '../helpers/home-visual'
import { alignMockupText, box, compare, MOCKUP_DIR, open } from '../visual.util'
import type { IDataMasks } from '../visual.util'

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '1440', width: 1440, height: 900 }
]

const COUNT_MASKS: IDataMasks = { mockup: ['.fchip .num'], app: ['.match-queue-filters__count'] }
const SELECT_MASKS: IDataMasks = { mockup: [], app: [], values: { mockup: ['.adm-sel-row .input'], app: ['.match-queue-filters__select'] } }

const ZONES = [
  { name: 'matchs-titre', mockup: '.adm-head', app: '.admin-matches__head' },
  { name: 'matchs-puces', mockup: '.m-filters', app: '[data-cy="admin-matches-filters"]', masks: COUNT_MASKS },
  { name: 'matchs-selecteurs', mockup: '.adm-sel-row', app: '.match-queue-filters__selects', masks: SELECT_MASKS }
]

for (const viewport of VIEWPORTS) {
  test.describe(`F-08 admin Poules et matchs @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser, context }) => {
        await signIn(context, 'admin')
        const { mockup, mockContext } = await open(page, browser, viewport, 'admin-matchs.html', '/admin/matchs')
        const mockBox = await box(mockup, zone.mockup)
        const appBox = await box(page, zone.app)
        await compare(page, mockup, zone.name, viewport.name, mockBox, appBox, zone.masks)
        await mockContext.close()
      })
    }
  })
}

const DIALOG_MASKS: IDataMasks = { mockup: [], app: [] }

for (const viewport of VIEWPORTS) {
  test.describe(`F-08 saisie du score @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('matchs-saisie', async ({ page, browser, context }) => {
      await signIn(context, 'admin')
      const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
      const mockup = await mockContext.newPage()
      await mockup.goto(`file://${MOCKUP_DIR}/admin-matchs.html`)
      await mockup.evaluate(() => document.fonts.ready)
      await mockup.addStyleTag({ content: '.sheet-scrim { display: none !important; } .sheet { animation: none !important; }' })
      await page.goto('/admin/matchs')
      await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
      await page.locator('[data-cy^="admin-match-enter-"]').first().click()
      await page.locator('[data-cy="admin-score-form"]').waitFor()
      await page.locator('[data-cy="admin-score-input-0"] input').fill('5')
      await page.locator('[data-cy="admin-score-input-1"] input').fill('1')
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.addStyleTag({ content: '*, *::before, *::after { caret-color: transparent !important; transition: none !important; animation: none !important; }' })
      await page.evaluate(() => document.fonts.ready)
      await alignMockupText(mockup, page, [
        { mockup: '.sheet__h .eyebrow', app: '[role=dialog] .origam-card-header__subtitle' },
        { mockup: '.duel__p label', app: '[role=dialog] .score-entry-form__name' },
        { mockup: '.sheet__meta', app: '[data-cy="admin-score-meta"]' }
      ])
      await alignToPixel(mockup, '.sheet')
      await alignToPixel(page, '.origam-overlay__content')
      const mockBox = await box(mockup, '.sheet')
      const appBox = await box(page, '[role=dialog]')
      await compare(page, mockup, 'matchs-saisie', viewport.name, mockBox, appBox, DIALOG_MASKS)
      await mockContext.close()
    })
  })
}
