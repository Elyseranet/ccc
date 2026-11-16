import { test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { createFinalValidatedEdition, createQualifiedEdition, selectAdminEdition } from '../helpers/edition-write'
import type { IWriteEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'
import { alignMockupText, box, compare, MOCKUP_DIR, settle } from '../visual.util'
import type { IDataMasks } from '../visual.util'

/*********************************************************
 * F-51 : zones visuelles de « Rouvrir les qualifications » (admin-qualification.html, états « Rouvrir »)
 *
 * @description
 * Pourquoi `writes/` : l'écran se mesure sur des éditions créées par le test (QA-3, jamais 2026), dans des états que la base de test n'a pas : liste arrêtée (4 poules de 2, 8 qualifiés, quarts),
 * tirage du premier tour validé (2 poules de 2, finale), et le refus 409 d'un tirage validé entre-temps. La maquette parle des huitièmes et de 16 qualifiés : le TOUR et le NOMBRE sont recopiés
 * de l'application dans la maquette (valeurs de données, ARCH-9) ; gabarit, pastille, bouton outlined, raison et alerte restent comparés. La date d'arrêt de la maquette (« Arrêtée le 14/06 à 23:40 »)
 * n'existe pas dans l'API : la phrase de l'application est recopiée. Non comparés : les deux boîtes de confirmation (DIALOG-ZONES, mesuré avec F-30), le snackbar (Origam, hors flux) :
 * couverts par `F-51.spec.ts` (focus, Échap, axe) et les tests de composant.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]
const PAGE = '/admin/phase-finale/qualification'
const NO_MASKS: IDataMasks = { mockup: [], app: [] }
const STATUS_OK = 200

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

/**
 * Cale le haut de la zone sur un pixel entier par un décalage `top`, pas par une marge : `alignToPixel` pose une marge haute, qui disparaît dans la marge basse de l'élément précédent
 * (les marges adjacentes fusionnent), et le texte du résumé se pose alors sur des fractions de pixel différentes des deux côtés (mesuré : 1 px sur la 2e ligne à 390).
 */
const alignByOffset = async (page: Page, selector: string) => {
  await page.evaluate((target) => {
    const element = document.querySelector(target) as HTMLElement
    const top = element.getBoundingClientRect().top + window.scrollY
    element.style.position = 'relative'
    element.style.top = `${Math.ceil(top) - top}px`
  }, selector)
}

/** Remplace, dans les textes de la maquette, une valeur de donnée (« des huitièmes », « 16 qualifiés ») par celle de l'application. */
const replaceInMockup = async (mockup: Page, replacements: Array<[string, string]>) => {
  await mockup.evaluate((pairs) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      for (const [from, to] of pairs) {
        if (node.nodeValue?.includes(from)) {
          node.nodeValue = node.nodeValue.replaceAll(from, to)
        }
      }
    }
  }, replacements)
}

const validateFirstRound = async (request: APIRequestContext, edition: IWriteEdition) => {
  const preview = (await (await request.get(`/api/v1/admin/editions/${edition.id}/tirages/tour`)).json()) as { candidates: Array<{ participationId: string }> }
  const draw = (await (await request.post(`/api/v1/editions/${edition.id}/tirages/tour`, { data: {} })).json()) as { id: string }
  const assignments = [0, 1].flatMap(index => [
    { participationId: preview.candidates[index * 2]!.participationId, pairingIndex: index + 1, sidePosition: 1, drawnOrder: index * 2 + 1 },
    { participationId: preview.candidates[index * 2 + 1]!.participationId, pairingIndex: index + 1, sidePosition: 2, drawnOrder: index * 2 + 2 }
  ])
  await request.put(`/api/v1/tirages/${draw.id}/affectations`, { data: { assignments } })
  const validated = await request.post(`/api/v1/tirages/${draw.id}/validation`)
  if (validated.status() !== STATUS_OK) {
    throw new Error(`POST validation a répondu ${validated.status()}`)
  }
}

const STATES = [
  { name: 'ro-actif', mockup: 'section[aria-labelledby="h-ro"] .q-act', app: '[data-cy="qualification-reopen"]', round: 'des quarts', count: '8 qualifiés' },
  { name: 'ro-entete', mockup: 'section[aria-labelledby="h-ro"] > header', app: '.qualification-finalize__head', round: 'des quarts', count: '8 qualifiés' },
  { name: 'ro-resume', mockup: 'section[aria-labelledby="h-ro"] > p.muted', app: '[data-cy="qualification-finalize-summary"]', round: 'des quarts', count: '8 qualifiés' },
  { name: 'ro-inactif', mockup: 'section[aria-labelledby="h-rox"] .q-act', app: '[data-cy="qualification-reopen"]', round: 'de la finale', count: '2 qualifiés' },
  { name: 'ro-erreur', mockup: '.mock-states [data-f51-error]', app: '[data-cy="qualification-failure"]', round: 'des demi-finales', count: '4 qualifiés' }
]

for (const viewport of VIEWPORTS) {
  test.describe(`F-51 rouvrir les qualifications @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const state of STATES) {
      test(state.name, async ({ page, browser, context }) => {
        await signIn(context, 'admin')
        const label = `f51z${state.name.slice(3, 6)}${viewport.name}`
        const edition = state.name === 'ro-inactif'
          ? await createFinalValidatedEdition(context.request, label, false)
          : await createQualifiedEdition(context.request, label, state.name === 'ro-erreur' ? 2 : 4)
        await selectAdminEdition(context, edition)
        const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
        const mockup = await mockContext.newPage()
        await mockup.goto(`file://${MOCKUP_DIR}/admin-qualification.html`)
        await settle(mockup)
        await mockup.evaluate(() => { [...document.querySelectorAll('.mock-states .alert--error')].find(alert => (alert.textContent ?? '').includes('validé entre-temps'))?.setAttribute('data-f51-error', '1') })
        await page.goto(PAGE)
        await hydrated(page)
        await page.getByTestId('qualification-finalized').waitFor()
        if (state.name === 'ro-erreur') {
          await validateFirstRound(context.request, edition)
          await page.getByTestId('qualification-reopen-open').click()
          await page.getByTestId('qualification-reopen-confirm').click()
          await page.getByTestId('qualification-failure').waitFor()
        }
        await settle(page)
        await mockup.addStyleTag({ content: '.adm-bottom { display: none !important; }' })
        await page.addStyleTag({ content: '.admin-bottom { display: none !important; }' })
        await replaceInMockup(mockup, [['des huitièmes', state.round], ['16 qualifiés', state.count]])
        if (state.name === 'ro-resume') {
          await alignMockupText(mockup, page, [{ mockup: 'section[aria-labelledby="h-ro"] > p.muted', app: '[data-cy="qualification-finalize-summary"]' }])
        }
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await alignByOffset(mockup, state.mockup)
        await alignByOffset(page, state.app)
        await compare(page, mockup, state.name, viewport.name, await box(mockup, state.mockup), await box(page, state.app), NO_MASKS)
        await mockContext.close()
      })
    }
  })
}
