import { test } from '@playwright/test'
import { signIn } from './helpers/session'
import { ADMIN_TOP_DATA_MASKS, box, compare, open } from './visual.util'

const EDITION_ROUTE = '/editions/2025'

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const PUBLIC_CASES = [
  { zone: 'accueil', mockup: 'index.html', route: '/' },
  { zone: 'edition', mockup: 'edition.html', route: EDITION_ROUTE }
]

const ADMIN_CASES = [
  { zone: 'admin', mockup: 'admin.html', route: '/admin' },
  { zone: 'admin-matchs', mockup: 'admin-matchs.html', route: '/admin/matchs' },
  { zone: 'admin-plus', mockup: 'admin-plus.html', route: '/admin/plus' }
]

for (const viewport of VIEWPORTS) {
  for (const entry of PUBLIC_CASES) {
    test.describe(`coque publique ${entry.zone} @${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      test('en-tête', async ({ page, browser }) => {
        const { mockup, mockContext } = await open(page, browser, viewport, entry.mockup, entry.route)
        const mockHeader = await box(mockup, '.hh-header')
        const appHeader = await box(page, '.public-shell__header')
        await compare(page, mockup, `entete-${entry.zone}`, viewport.name, { x: 0, y: 0, width: viewport.width, height: Math.ceil(mockHeader.y + mockHeader.height) }, { x: 0, y: 0, width: viewport.width, height: Math.ceil(appHeader.y + appHeader.height) })
        await mockContext.close()
      })

      test('pied de page', async ({ page, browser }) => {
        const { mockup, mockContext } = await open(page, browser, viewport, entry.mockup, entry.route)
        const alignFooter = () => {
          const footer = document.querySelector('footer') as HTMLElement
          const fraction = footer.getBoundingClientRect().top + window.scrollY
          const delta = Math.ceil(fraction) - fraction
          footer.style.marginTop = `calc(${getComputedStyle(footer).marginTop} + ${delta}px)`
        }
        await mockup.evaluate(alignFooter)
        await page.evaluate(alignFooter)
        const mockFooter = await box(mockup, 'footer')
        const mockGrid = await box(mockup, '.hh-footer__grid')
        const appFooter = await box(page, 'footer')
        const appInner = await box(page, '.public-footer__inner')
        const mockHeight = Math.ceil(mockGrid.y + mockGrid.height - mockFooter.y)
        const appHeight = Math.ceil(appInner.y + appInner.height - appFooter.y)
        await compare(page, mockup, `pied-de-page-${entry.zone}`, viewport.name, { x: 0, y: mockFooter.y, width: viewport.width, height: mockHeight }, { x: 0, y: appFooter.y, width: viewport.width, height: appHeight })
        await mockContext.close()
      })
    })
  }
}

for (const entry of ADMIN_CASES) {
  test.describe(`coque admin ${entry.zone} @1440`, () => {
    test.use({ viewport: { width: 1440, height: 900 } })

    test('tiroir et barre haute', async ({ page, browser, context }) => {
      await signIn(context, 'admin')
      const { mockup, mockContext } = await open(page, browser, { width: 1440, height: 900 }, entry.mockup, entry.route)
      const mockSide = await box(mockup, '.adm-side')
      const appSide = await box(page, '.admin-drawer')
      await compare(page, mockup, `tiroir-${entry.zone}`, '1440', { x: 0, y: 0, width: mockSide.width, height: 900 }, { x: 0, y: 0, width: appSide.width, height: 900 })
      const mockTop = await box(mockup, '.adm-top')
      const appTop = await box(page, '.admin-top')
      await compare(page, mockup, `barre-haute-${entry.zone}`, '1440', { x: mockSide.width, y: 0, width: 1440 - mockSide.width, height: Math.ceil(mockTop.y + mockTop.height) }, { x: appSide.width, y: 0, width: 1440 - appSide.width, height: Math.ceil(appTop.y + appTop.height) }, ADMIN_TOP_DATA_MASKS)
      await mockContext.close()
    })
  })

  test.describe(`coque admin ${entry.zone} @390`, () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('barre haute et barre basse', async ({ page, browser, context }) => {
      await signIn(context, 'admin')
      const { mockup, mockContext } = await open(page, browser, { width: 390, height: 844 }, entry.mockup, entry.route)
      const mockBottom = await box(mockup, '.adm-bottom')
      const appBottom = await box(page, '.admin-bottom')
      await compare(page, mockup, `barre-basse-${entry.zone}`, '390', mockBottom, appBottom)
      const mockTop = await box(mockup, '.adm-top')
      const appTop = await box(page, '.admin-top')
      await compare(page, mockup, `barre-haute-${entry.zone}`, '390', { x: 0, y: 0, width: 390, height: Math.ceil(mockTop.y + mockTop.height) }, { x: 0, y: 0, width: 390, height: Math.ceil(appTop.y + appTop.height) }, ADMIN_TOP_DATA_MASKS)
      await mockContext.close()
    })
  })
}
