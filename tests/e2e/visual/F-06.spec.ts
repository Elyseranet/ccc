import { test } from '@playwright/test'
import { box, compare, open } from '../visual.util'

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const ZONES = [
  { name: 'hero-titre', mockTab: null, appTab: null, mock: '.page-hero__title', app: '[data-cy="page-title"]' },
  { name: 'hero-chapo', mockTab: null, appTab: null, mock: '.page-hero__lead', app: '[data-cy="page-hero-lead"]' },
  { name: 'onglets', mockTab: null, appTab: null, mock: '.tabs', app: '[data-cy="rules-tabs"]' },
  { name: 'jeu-intro', mockTab: '#rg-t-jeu', appTab: 'rules-tab-game', mock: '.rules-intro', app: '.rules-game__intro' },
  { name: 'jeu-deroule', mockTab: '#rg-t-jeu', appTab: 'rules-tab-game', mock: '.steps-row', app: '[data-cy="rules-steps"]' },
  { name: 'jeu-note', mockTab: '#rg-t-jeu', appTab: 'rules-tab-game', mock: '.rules-note', app: '[data-cy="rules-note"]' },
  { name: 'jeu-regles-or', mockTab: '#rg-t-jeu', appTab: 'rules-tab-game', mock: '.golds', app: '.golden-rules__cards' },
  { name: 'tournoi', mockTab: '#rg-t-tournoi', appTab: 'rules-tab-tournament', mock: '.rules-grid', app: '.rules-tournament__grid' },
  { name: 'variantes', mockTab: '#rg-t-var', appTab: 'rules-tab-variants', mock: '.vars', app: '.rules-variants__grid' }
]

for (const viewport of VIEWPORTS) {
  test.describe(`règles @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser }) => {
        const { mockup, mockContext } = await open(page, browser, viewport, 'regles.html', '/regles')
        await mockup.addStyleTag({ content: '.hh-footer__note { display: none !important; }' })
        if (zone.mockTab) {
          await mockup.locator(zone.mockTab).click()
          await page.getByTestId(zone.appTab!).click()
        }
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        const mockBox = await box(mockup, zone.mock)
        const appBox = await box(page, zone.app)
        await compare(page, mockup, `regles-${zone.name}`, viewport.name, mockBox, appBox)
        await mockContext.close()
      })
    }
  })
}
