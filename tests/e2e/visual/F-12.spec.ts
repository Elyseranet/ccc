import { test } from '@playwright/test'
import { FIXTURE_SESSION_COOKIE } from '../pages.const'
import { box, compare, COOKIE_URL, open } from '../visual.util'

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '1440', width: 1440, height: 900 }
]

const ZONES = [
  { name: 'plus-titre', mockup: '.adm-head', app: '.admin-more__head' },
  { name: 'plus-liens', mockup: 'nav[aria-label="Plus d’options"]', app: '[data-cy="admin-more-nav"]' },
  { name: 'plus-edition', mockup: '.plus-ed', app: '.admin-more__edition' },
  { name: 'plus-deconnexion', mockup: '.plus-out', app: '[data-cy="admin-more-logout"]' }
]

for (const viewport of VIEWPORTS) {
  test.describe(`F-12 admin Plus @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser, context }) => {
        await context.addCookies([{ name: FIXTURE_SESSION_COOKIE, value: 'admin', url: COOKIE_URL }])
        const { mockup, mockContext } = await open(page, browser, viewport, 'admin-plus.html', '/admin/plus')
        const mockBox = await box(mockup, zone.mockup)
        const appBox = await box(page, zone.app)
        await compare(page, mockup, zone.name, viewport.name, mockBox, appBox)
        await mockContext.close()
      })
    }
  })
}
