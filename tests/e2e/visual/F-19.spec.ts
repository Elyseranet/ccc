import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { alignToPixel } from '../helpers/home-visual'
import { box, compare, open } from '../visual.util'

/*********************************************************
 * F-19 : pages légales et pied de page contre les maquettes de ui
 *
 * @description
 * Les textes de l'application (marqueurs `[À FOURNIR : …]`, durées, listes de défauts) diffèrent de ceux de la maquette :
 * avant la capture, le texte de chaque section de l'application est écrit dans le DOM de la maquette (marqueurs mis en
 * forme comme `.todo`), pour que la comparaison ne porte que sur le gabarit. Une section dont la structure diffère
 * (nombre de nœuds de texte) n'est pas alignée : son écart est alors réel et relu à la main.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const TEXT_NODES = 'h2, h3, p, li, dt, dd, th, td:not(:has(code)), caption'

interface IPageSpec {
  name: string
  file: string
  route: string
  sections: string[]
}

const PAGES: IPageSpec[] = [
  { name: 'mentions', file: 'mentions-legales.html', route: '/mentions-legales', sections: ['editeur', 'directeur', 'hebergeur', 'contact', 'pi', 'credits'] },
  { name: 'confidentialite', file: 'confidentialite.html', route: '/confidentialite', sections: ['responsable', 'donnees', 'finalites', 'durees', 'destinataires', 'droits', 'cookies', 'majeurs'] },
  { name: 'cgu', file: 'cgu.html', route: '/cgu', sections: ['objet', 'acces', 'compte', 'contenus', 'conduite', 'pi', 'exactitude', 'suspension', 'responsabilite', 'donnees', 'droit', 'modification'] },
  { name: 'accessibilite', file: 'accessibilite.html', route: '/accessibilite', sections: ['etat', 'fait', 'manque', 'connus', 'contact'] }
]

const alignSectionText = async (mockup: Page, page: Page, id: string) => {
  const texts = await page.locator(`[data-cy="legal-section-${id}"]`).evaluate((element, selector) =>
    [...element.querySelectorAll(selector)].map(node => (node.textContent ?? '').replace(/\s+/g, ' ').trim()), TEXT_NODES)
  await mockup.locator(`section[aria-labelledby="h-${id}"]`).evaluate((element, [selector, values]) => {
    const nodes = [...element.querySelectorAll(selector as string)]
    if (nodes.length !== (values as string[]).length) {
      return
    }
    const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    nodes.forEach((node, index) => {
      const html = escape((values as string[])[index]!).replace(/(\[À (?:FOURNIR|CONFIRMER) : [^\]]*\])/g, '<span class="todo">$1</span>')
      node.innerHTML = html
    })
  }, [TEXT_NODES, texts] as [string, string[]])
}

for (const viewport of VIEWPORTS) {
  for (const spec of PAGES) {
    test.describe(`${spec.name} @${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      const zone = async (page: Page, browser: Parameters<typeof open>[1], name: string, mock: string, app: string, sectionId?: string) => {
        const { mockup, mockContext } = await open(page, browser, viewport, spec.file, spec.route)
        await mockup.addStyleTag({ content: '.hh-footer__note { display: none !important; }' })
        if (sectionId) {
          await alignSectionText(mockup, page, sectionId)
        }
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await alignToPixel(mockup, mock)
        await alignToPixel(page, app)
        const mockBox = await box(mockup, mock)
        const appBox = await box(page, app)
        await compare(page, mockup, `${spec.name}-${name}`, viewport.name, mockBox, appBox)
        await mockContext.close()
      }

      test('fil-ariane', async ({ page, browser }) => zone(page, browser, 'fil-ariane', '.crumbs', '[data-cy="legal-breadcrumb"]'))
      test('titre', async ({ page, browser }) => zone(page, browser, 'titre', '.legal__title', '[data-cy="page-title"]'))
      test('sommaire', async ({ page, browser }) => zone(page, browser, 'sommaire', '.toc-nav', '[data-cy="legal-toc"]'))
      test('voir-aussi', async ({ page, browser }) => zone(page, browser, 'voir-aussi', '.legal-links', '[data-cy="legal-related"]'))
      test('pied-de-page', async ({ page, browser }) => zone(page, browser, 'pied', '.hh-footer', '.public-footer'))

      for (const id of spec.sections) {
        test(`section-${id}`, async ({ page, browser }) =>
          zone(page, browser, `section-${id}`, `section[aria-labelledby="h-${id}"]`, `[data-cy="legal-section-${id}"]`, id))
      }
    })
  }
}

/*********************************************************
 * Page d'erreur (`erreur.html`, décision 9639ca1) : 404 réel, et erreur générique par la route de rendu d'erreur de
 * Nuxt en développement (`/__nuxt_error`).
 ********************************************************/
const ERROR_STATES = [
  { name: '404', file: 'erreur.html', route: '/page-qui-nexiste-pas', statusCode: undefined },
  { name: 'generique', file: 'erreur.html?generique', route: '/regles', statusCode: 500 }
]

/** L'erreur générique est posée dans l'état Nuxt (`payload.error`), comme le ferait `showError` : la page d'erreur remplace alors la page. */
const showGenericError = async (page: Page, statusCode: number) => {
  await page.evaluate((code) => {
    (window as unknown as { useNuxtApp: () => { payload: { error: unknown } } }).useNuxtApp().payload.error = { statusCode: code, statusMessage: 'Erreur', message: 'Cannot read properties of undefined' }
  }, statusCode)
  await page.locator('[data-cy="error-page"]').waitFor()
}

const ERROR_ZONES = [
  { name: 'hero', mock: '.err-hero', app: '[data-cy="error-page"]' },
  { name: 'pied', mock: '.hh-footer', app: '.public-footer' }
]

for (const viewport of VIEWPORTS) {
  for (const state of ERROR_STATES) {
    test.describe(`erreur ${state.name} @${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      for (const zone of ERROR_ZONES) {
        test(zone.name, async ({ page, browser }) => {
          const { mockup, mockContext } = await open(page, browser, viewport, state.file, state.route)
          // `.err-hero__cta { display: flex }` l'emporte sur `[hidden]` : la rangée de boutons de l'état inactif reste visible dans la maquette.
          await mockup.addStyleTag({ content: '.hh-footer__note { display: none !important; } [hidden] { display: none !important; }' })
          if (state.statusCode) {
            await showGenericError(page, state.statusCode)
          }
          await mockup.evaluate(() => window.scrollTo(0, 0))
          await page.evaluate(() => window.scrollTo(0, 0))
          await alignToPixel(mockup, zone.mock)
          await alignToPixel(page, zone.app)
          const mockBox = await box(mockup, zone.mock)
          const appBox = await box(page, zone.app)
          await compare(page, mockup, `erreur-${state.name}-${zone.name}`, viewport.name, mockBox, appBox)
          await mockContext.close()
        })
      }
    })
  }
}
