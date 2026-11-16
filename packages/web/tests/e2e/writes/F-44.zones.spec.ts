import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createTiedPoolsEdition, selectAdminEdition } from '../helpers/edition-write'
import type { IAdminMatchView } from '../helpers/edition-write'
import { alignToPixel } from '../helpers/home-visual'
import { signIn } from '../helpers/session'
import { alignMockupText, box, compare, MOCKUP_DIR, settle } from '../visual.util'
import type { IDataMasks } from '../visual.util'

/*********************************************************
 * F-44 : zones visuelles de la suppression d'un départage (admin-qualification.html, états « Départage créé / joué / 409 »)
 *
 * @description
 * Pourquoi `writes/` : l’écran se mesure sur une édition créée par le test (QA-3), dans un état que la base de test n'a pas : une égalité entre poules à 2 joueurs (2 poules de 2, chaque
 * match 5-2, n = 1 et m = 1), un départage créé par l'API, puis (état « joué ») un score saisi sans validation, ou (état « 409 ») un score saisi pendant que le dialogue est ouvert.
 * La maquette montre l'égalité d'une poule (« Poule 3 · 2e place »), l'application celle d'une frontière : les VALEURS (noms, numéro du match, rang, texte de raison) sont recopiées de l'application
 * dans la maquette ; gabarit, pastilles, boutons, filets et espacements restent comparés. Largeur de la carte : la maquette la montre en pleine largeur dans « États », l'application en demi-largeur dans la liste : la
 * maquette prend la largeur de l'application. Non comparés : le dialogue (DIALOG-ZONES, mesuré avec F-30), le snackbar (Origam, hors flux), l'alerte « édition clôturée » (état non reproductible sans clôture entre deux actions) :
 * couverts par les tests de composant et `F-44.spec.ts`.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]
const PAGE = '/admin/phase-finale/qualification'
const NO_MASKS: IDataMasks = { mockup: [], app: [] }
const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'

const hideInk = async (page: Page, selectors: string[]) => {
  await page.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

type TAdminMatch = IAdminMatchView & { status: string }
const tiebreakOf = async (page: Page, editionId: string): Promise<TAdminMatch> => {
  const matches = (await (await page.request.get(`/api/v1/admin/editions/${editionId}/matchs`)).json()) as TAdminMatch[]
  return matches.find(match => match.purpose === 'TIEBREAK')!
}

const recordScore = async (page: Page, match: TAdminMatch) => {
  const scores = match.sides.map((side, index) => ({ participationId: side.participationId, score: [5, 3][index]! }))
  await page.request.put(`/api/v1/matchs/${match.id}/score`, { data: { scores }, headers: { 'If-Match': `"${match.version}"` } })
}

const STATES = [
  { name: 'dt-cree', mockup: '.mock-states .q-tie:has(button.btn--outlined:not([disabled]))', app: '[data-cy="qualification-tie-0"]' },
  { name: 'dt-joue', mockup: '.mock-states .q-tie:has(button.btn--outlined[disabled])', app: '[data-cy="qualification-tie-0"]' },
  { name: 'dt-erreur-joue', mockup: '.mock-states [data-f44-error]', app: '[data-cy="qualification-failure"]' }
]

for (const viewport of VIEWPORTS) {
  test.describe(`F-44 départage supprimable @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const state of STATES) {
      test(state.name, async ({ page, browser, context }) => {
        await signIn(context, 'admin')
        const { edition, losers } = await createTiedPoolsEdition(context.request, `f44z${state.name.slice(3, 7)}${viewport.name}`, 2)
        await selectAdminEdition(context, edition)
        const created = await context.request.post(`/api/v1/editions/${edition.id}/departages`, { data: { participationIds: losers, parameters: { topPerPool: 1, bestNextCount: 1 } } })
        if (created.status() !== 201) {
          throw new Error(`POST departages a répondu ${created.status()}`)
        }
        if (state.name === 'dt-joue') {
          await recordScore(page, await tiebreakOf(page, edition.id))
        }
        const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
        const mockup = await mockContext.newPage()
        await mockup.goto(`file://${MOCKUP_DIR}/admin-qualification.html`)
        await settle(mockup)
        await mockup.evaluate(() => { [...document.querySelectorAll('.mock-states .alert--error')].find(alert => (alert.textContent ?? '').includes('joué entre-temps'))?.setAttribute('data-f44-error', '1') })
        await page.goto(PAGE)
        await hydrated(page)
        await page.getByTestId('qualification-top-per-pool').locator('input').fill('1')
        await page.getByTestId('qualification-best-next').locator('input').fill('1')
        await page.getByTestId('qualification-tie-0').waitFor()
        if (state.name === 'dt-erreur-joue') {
          await page.getByTestId('qualification-delete-tiebreak-0').click()
          await page.getByTestId('qualification-delete-tiebreak-dialog').waitFor()
          await recordScore(page, await tiebreakOf(page, edition.id))
          await page.getByTestId('qualification-delete-tiebreak-confirm').click()
          await page.getByTestId('qualification-failure').waitFor()
        }
        await settle(page)
        await mockup.addStyleTag({ content: '.adm-bottom { display: none !important; }' })
        await page.addStyleTag({ content: '.admin-bottom { display: none !important; }' })
        if (state.app.includes('tie-0')) {
          const width = (await box(page, state.app)).width
          await mockup.addStyleTag({ content: `.mock-states .q-tie { width: ${width}px; justify-self: start; }` })
          const card = '.mock-states .q-tie:has(button.btn--outlined' + (state.name === 'dt-joue' ? '[disabled]' : ':not([disabled])') + ')'
          await alignMockupText(mockup, page, [
            { mockup: `${card} .eyebrow`, app: '[data-cy="qualification-tie-0"] .qualification-ties__eyebrow' },
            { mockup: `${card} .q-tie__who`, app: '[data-cy="qualification-tie-0"] .qualification-ties__who' },
            { mockup: `${card} .q-tie__st .chip`, app: '[data-cy="qualification-tie-0"] .qualification-ties__status .origam-chip' },
            { mockup: `${card} .q-why`, app: '[data-cy="qualification-tie-delete-why-0"]' }
          ])
          await hideInk(mockup, [`${card} .eyebrow`, `${card} .q-tie__who`, `${card} .q-tie__st .chip`])
          await hideInk(page, ['[data-cy="qualification-tie-0"] .qualification-ties__eyebrow', '[data-cy="qualification-tie-0"] .qualification-ties__who', '[data-cy="qualification-tie-0"] .qualification-ties__status .origam-chip'])
        }
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await alignToPixel(mockup, state.mockup)
        await alignToPixel(page, state.app)
        await compare(page, mockup, state.name, viewport.name, await box(mockup, state.mockup), await box(page, state.app), NO_MASKS)
        await mockContext.close()
      })
    }
  })
}
