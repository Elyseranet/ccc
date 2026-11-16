import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { signIn } from '../helpers/session'
import { box, compare, open } from '../visual.util'
import type { IDataMasks } from '../visual.util'

/*********************************************************
 * Éditions et compétiteurs de l'admin : comparaison visuelle par zone (F-13, FA-04, ARCH-9)
 *
 * @description
 * La maquette `admin-editions.html` affiche une page par ancre (`#ed-p-list`, `#ed-p-new`, `#ed-p-edit`, `#ed-p-comp`) ; chacune est
 * comparée à la vraie page. Seules les VALEURS de données sont masquées des deux côtés (encre transparente) : filet, fond, rayon,
 * gabarit et positions restent comparés. Les états de la maquette qui s'affichent en permanence (messages d'erreur, confirmation) sont
 * comparés dans des tests dédiés qui provoquent le même état dans l'application. Le snackbar est masqué (vérifié en e2e). Seuil : 1 % par zone.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'

const hideInk = async (target: Page, selectors: string[]) => {
  if (selectors.length > 0) {
    await target.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
  }
}

const alignToPixel = async (target: Page, selector: string) => {
  await target.evaluate((value) => {
    const element = document.querySelector(value) as HTMLElement
    const top = element.getBoundingClientRect().top + window.scrollY
    const delta = Math.ceil(top) - top
    element.style.marginTop = `calc(${getComputedStyle(element).marginTop} + ${delta}px)`
  }, selector)
}

// La barre basse (fixe, sous 1000 px) recouvre les zones du bas de page dans la capture ; elle a ses propres zones (F-12, coque admin).
const BOTTOM_BAR_HIDDEN = '.adm-bottom, .admin-bottom { visibility: hidden !important; }'

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
  await page.addStyleTag({ content: BOTTOM_BAR_HIDDEN })
}

/**
 * Données réelles contre données de maquette (même principe qu'`alignMockupText`) : la pagination dépend du nombre de pages
 * (15 avec 146 compétiteurs, 5 pastilles dans la maquette). On recopie dans la maquette, en mémoire, la liste des pastilles de
 * l'application. Les largeurs de colonnes ne sont PAS recopiées : l'application les fixe elle-même et la mesure doit les juger.
 */
const alignPager = async (mockup: Page, page: Page) => {
  const range = await page.getByTestId('competitors-pager-range').innerText()
  const pages = await page.locator('[data-cy="competitors-pagination"] .origam-pagination__item').allInnerTexts()
  await mockup.evaluate(([text, labels]) => {
    const pager = document.querySelector('#ed-p-comp .pager') as HTMLElement
    pager.querySelector('.num')!.textContent = text as string
    const list = pager.querySelector('ol') as HTMLElement
    const model = list.querySelector('li:not(:first-child)') as HTMLElement
    const current = list.querySelector('li:first-child') as HTMLElement
    list.replaceChildren(...(labels as string[]).map((label, index) => {
      const item = (index === 0 ? current : model).cloneNode(true) as HTMLElement
      item.querySelector('a')!.textContent = label
      return item
    }))
  }, [range, pages] as [string, string[]])
}

const showScreen = async (mockup: Page, anchor: string, extraCss = '') => {
  await mockup.evaluate((hash) => {
    location.hash = hash
  }, `#${anchor}`)
  await mockup.addStyleTag({ content: `.snack { display: none !important; } ${BOTTOM_BAR_HIDDEN} .adm-head, .screens { display: none !important; } ${extraCss}` })
  await mockup.waitForTimeout(100)
}

interface IZone { zone: string, mockup: string, app: string, ink?: { mockup: string[], app: string[] }, masks?: IDataMasks }

const compareZone = async (page: Page, mockup: Page, viewport: string, entry: IZone) => {
  // Le pointeur reste là où le test a cliqué : à 390 px, il survole une zone et peint son état « hover », absent de la maquette.
  await page.mouse.move(0, 0)
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur()
    window.scrollTo(0, 0)
  })
  await mockup.evaluate(() => window.scrollTo(0, 0))
  await hideInk(mockup, entry.ink?.mockup ?? [])
  await hideInk(page, entry.ink?.app ?? [])
  await alignToPixel(mockup, entry.mockup)
  await alignToPixel(page, entry.app)
  await compare(page, mockup, entry.zone, viewport, await box(mockup, entry.mockup), await box(page, entry.app), entry.masks)
}

const compareAll = async (page: Page, mockup: Page, viewport: string, entries: IZone[]) => {
  for (const entry of entries) {
    await compareZone(page, mockup, viewport, entry)
  }
}

const field = (testId: string) => `[data-cy="${testId}"]`

/** L'origine d'une édition (archive ou application) est une donnée : la pastille est masquée des deux côtés, sa colonne reste comparée. */
const ORIGIN_HIDDEN = '#ed-p-list tbody td:nth-child(6) > * { visibility: hidden !important; }'
const hideOrigin = (target: Page) => target.addStyleTag({ content: `${field('editions-table')} tbody td:nth-child(6) .origam-chip { visibility: hidden !important; }` })

for (const viewport of VIEWPORTS) {
  test.describe(`éditions et compétiteurs @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test.beforeEach(async ({ context }) => {
      await signIn(context, 'admin')
    })

    test('editions-liste', async ({ page, browser }) => {
      const { mockup, mockContext } = await open(page, browser, viewport, 'admin-editions.html', '/admin/editions')
      await hydrated(page)
      await showScreen(mockup, 'ed-p-list', `${ORIGIN_HIDDEN} `)
      await hideOrigin(page)
      await compareAll(page, mockup, viewport.name, [
        { zone: 'editions-barre', mockup: '#ed-p-list .ed-bar', app: '.editions-toolbar' },
        { zone: 'editions-entete-table', mockup: '#ed-p-list thead', app: field('editions-table') + ' thead' },
        {
          zone: 'editions-ligne-2026',
          mockup: '#ed-p-list tbody tr:first-child',
          app: field('editions-table') + ' tbody tr:first-child',
          ink: { mockup: ['#ed-p-list tbody tr:first-child td:not(:nth-child(5)):not(:nth-child(6)):not(:nth-child(8))'], app: [field('editions-table') + ' tbody tr:first-child td:not(:nth-child(5)):not(:nth-child(6)):not(:nth-child(8))'] }
        },
        { zone: 'editions-note', mockup: '#ed-p-list .ed-note', app: field('editions-note') }
      ])
      await mockContext.close()
    })

    test('editions-creation', async ({ page, browser }) => {
      const { mockup, mockContext } = await open(page, browser, viewport, 'admin-editions.html', '/admin/editions/nouvelle')
      await hydrated(page)
      await showScreen(mockup, 'ed-p-new', '#ed-p-new .ed-done, #ed-p-new .alert--error { display: none !important; }')
      await page.locator('input[inputmode="numeric"]').fill('27')
      await page.getByTestId('edition-form-name').locator('input').fill('Championnat de Caps 2027')
      await page.getByTestId('edition-form-submit').click()
      await expect(page.getByTestId('edition-form-year')).toContainText('année sur 4 chiffres')
      await compareAll(page, mockup, viewport.name, [
        { zone: 'creation-entete', mockup: '#ed-p-new .ed-form__h', app: '.edition-form__head' },
        { zone: 'creation-annee', mockup: '#ed-p-new .ed-grid > .field:nth-child(1)', app: '.edition-form__field:nth-child(1)' },
        { zone: 'creation-nom', mockup: '#ed-p-new .ed-grid > .field:nth-child(2)', app: '.edition-form__field:nth-child(2)', ink: { mockup: ['#c-name'], app: [field('edition-form-name') + ' input'] } },
        { zone: 'creation-date', mockup: '#ed-p-new .ed-grid > .field:nth-child(3)', app: '.edition-form__field:nth-child(3)', ink: { mockup: ['#c-date'], app: [field('edition-form-date') + ' input'] } },
        { zone: 'creation-lieu', mockup: '#ed-p-new .ed-grid > .field:nth-child(4)', app: '.edition-form__field:nth-child(4)' },
        { zone: 'creation-description', mockup: '#ed-p-new .ed-grid > .field:nth-child(5)', app: '.edition-form__field--full' },
        { zone: 'creation-code', mockup: '#ed-p-new .alert--info', app: field('edition-form-code-info') },
        { zone: 'creation-actions', mockup: '#ed-p-new .ed-cta', app: '.edition-form__cta' }
      ])
      await mockContext.close()
    })

    test('editions-creation-erreurs', async ({ page, browser }) => {
      const { mockup, mockContext } = await open(page, browser, viewport, 'admin-editions.html', '/admin/editions/nouvelle')
      await hydrated(page)
      await showScreen(mockup, 'ed-p-new', '#ed-p-new .ed-done { display: none !important; }')
      await page.route('**/api/v1/editions', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.fallback()
          return
        }
        await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ statusCode: 409, code: 'EDITION_CODE_EXHAUSTED', message: 'x' }) })
      })
      await page.locator('input[inputmode="numeric"]').fill('2027')
      await page.getByTestId('edition-form-name').locator('input').fill('Championnat de Caps 2027')
      await page.getByTestId('edition-form-submit').click()
      await expect(page.getByTestId('edition-form-error')).toBeVisible()
      await compareZone(page, mockup, viewport.name, { zone: 'creation-erreur-409', mockup: '#ed-p-new .alert--error:last-of-type', app: field('edition-form-error') })
      await mockContext.close()
    })

    test('editions-modification', async ({ page, browser }) => {
      const { mockup, mockContext } = await open(page, browser, viewport, 'admin-editions.html', '/admin/editions/2026')
      await hydrated(page)
      await showScreen(mockup, 'ed-p-edit', '#ed-p-edit .ed-form--locked { display: none !important; }')
      await compareAll(page, mockup, viewport.name, [
        { zone: 'modification-entete', mockup: '#ed-p-edit .ed-form__h', app: '.edition-form__head' },
        { zone: 'modification-lecture-seule', mockup: '#ed-p-edit .ed-ro', app: field('edition-readonly') },
        { zone: 'modification-nom', mockup: '#ed-p-edit .ed-grid > .field:nth-child(1)', app: '.edition-form__field:nth-child(1)' },
        { zone: 'modification-description', mockup: '#ed-p-edit .ed-grid > .field:nth-child(4)', app: '.edition-form__field--full' },
        { zone: 'modification-actions', mockup: '#ed-p-edit .ed-cta', app: '.edition-form__cta' }
      ])
      await mockContext.close()
    })

    test('editions-cloturee', async ({ page, browser }) => {
      const { mockup, mockContext } = await open(page, browser, viewport, 'admin-editions.html', '/admin/editions/2025')
      await hydrated(page)
      await showScreen(mockup, 'ed-p-edit', '#ed-p-edit .ed-form:not(.ed-form--locked), .ed-form--locked > .alert--error { display: none !important; }')
      await compareAll(page, mockup, viewport.name, [
        { zone: 'cloturee-entete', mockup: '#ed-p-edit .ed-form--locked .ed-form__h', app: '.edition-closed__head' },
        { zone: 'cloturee-bandeau', mockup: '#ed-p-edit .ed-form--locked .alert--info', app: field('edition-closed-notice') },
        { zone: 'cloturee-lecture-seule', mockup: '#ed-p-edit .ed-form--locked .ed-ro', app: field('edition-readonly') }
      ])
      await mockContext.close()
    })

    test('competiteurs', async ({ page, browser }) => {
      const list = await (await page.request.get('/api/v1/competiteurs?pageSize=10&sort=displayName')).json() as { items: Array<{ id: string }> }
      const { mockup, mockContext } = await open(page, browser, viewport, 'admin-editions.html', `/admin/competiteurs/${list.items[0]!.id}`)
      await hydrated(page)
      await showScreen(mockup, 'ed-p-comp', '#ed-p-comp .cp-photo .alert { display: none !important; }')
      const masks = { mockup: [] as string[], app: [] as string[] }
      await alignPager(mockup, page)
      await compareAll(page, mockup, viewport.name, [
        { zone: 'competiteurs-barre', mockup: '#ed-p-comp .ed-bar', app: '.competitors-toolbar', masks },
        { zone: 'competiteurs-entete-table', mockup: '#ed-p-comp thead', app: field('competitors-table') + ' thead', masks },
        {
          zone: 'competiteurs-ligne',
          mockup: '#ed-p-comp tbody tr:nth-child(2)',
          app: field('competitors-table') + ' tbody tr:nth-child(2)',
          ink: { mockup: ['#ed-p-comp tbody tr:nth-child(2) td:not(:last-child)'], app: [field('competitors-table') + ' tbody tr:nth-child(2) td:not(:last-child)'] }
        },
        { zone: 'competiteurs-pagination', mockup: '#ed-p-comp .pager', app: field('competitors-pagination') },
        { zone: 'competiteurs-carte-entete', mockup: '#cp-form .ed-form__h', app: '.identity-form__head', ink: { mockup: ['#h-cp'], app: [field('competitor-form-title')] } },
        { zone: 'competiteurs-photo', mockup: '#cp-form .cp-photo', app: field('competitor-photo'), ink: { mockup: ['#cp-form .cp-av'], app: [field('competitor-photo-avatar')] } },
        { zone: 'competiteurs-identite-actions', mockup: '#cp-form .ed-cta', app: '.identity-form__cta' }
      ])
      await mockContext.close()
    })
  })
}
