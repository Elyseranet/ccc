import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createQualifiedEdition, selectAdminEdition } from '../helpers/edition-write'
import { alignToPixel } from '../helpers/home-visual'
import { signIn } from '../helpers/session'
import { alignMockupText, box, compare, MOCKUP_DIR, settle } from '../visual.util'
import type { IDataMasks } from '../visual.util'

/*********************************************************
 * F-25 : zones visuelles du tirage du tour (admin-tirage-tour.html)
 *
 * @description
 * Pourquoi `writes/` et non `visual/` : l'écran se mesure sur une édition créée par le test (QA-3, jamais 2026), dans un état que la base de test n'a pas : 4 poules de 2 qualifiées
 * (8 joueurs, quarts), UNE affiche déjà tirée (une carte « Changer », l'affiche en cours, des emplacements « Affiche à tirer »). La maquette montre les huitièmes (16 joueurs, 3 affiches
 * tirées) : les VALEURS (noms, nombres, textes de données) sont rendues transparentes des deux côtés ou recopiées de l'application dans la maquette ; gabarit, filets, rayons, pastilles
 * et boutons restent comparés. Seules les parties qui ne dépendent pas du nombre de joueurs sont comparées (en-têtes, carte tirée, carte en cours, emplacement libre, haut du vivier,
 * en-tête de « À placer », zone du bouton de validation) : les listes et tableaux qui suivent le nombre de joueurs sont couverts par les tests de composant et les e2e (`F-25.spec.ts`).
 * Le dialogue n'est pas comparé (F-30), ni les états du bloc « États » de la maquette (alertes, choix du tour : tests de composant et e2e).
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]
const PAGE = '/admin/phase-finale/tirage'
const NO_MASKS: IDataMasks = { mockup: [], app: [] }
const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'

const hideInk = async (page: Page, selectors: string[]) => {
  await page.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

/** Boîte du haut d'un conteneur au bas de son premier élément `end`. */
const boxTo = async (page: Page, container: string, end: string) => page.evaluate(([containerSelector, endSelector]) => {
  const root = document.querySelector(containerSelector as string) as HTMLElement
  const last = root.querySelector(endSelector as string) as HTMLElement
  const a = root.getBoundingClientRect()
  const b = last.getBoundingClientRect()
  return { x: a.left + window.scrollX, y: a.top + window.scrollY, width: a.width, height: b.bottom - a.top }
}, [container, end])

const ZONES: Array<{ name: string, mockup: string, app: string, upTo?: { mockup: string, app: string }, masks?: IDataMasks }> = [
  { name: 'ti-phase', mockup: '.ostep--phase', app: '[data-cy="phase-steps"]' },
  { name: 'ti-entete', mockup: '.adm-head', app: '.admin-round-draw__head' },
  { name: 'ti-saisie-titre', mockup: '.tir-main > header', app: '.round-draw-head__head' },
  { name: 'ti-tour', mockup: '.tir-main .r-round', app: '[data-cy="round-draw-round"]' },
  { name: 'ti-affiche-tiree', mockup: '.r-affs > li:nth-child(1)', app: '[data-cy="round-draw-pairing-1"]' },
  { name: 'ti-affiche-en-cours', mockup: '.r-aff--next', app: '[data-cy="round-draw-pairing-2"]' },
  { name: 'ti-affiche-libre', mockup: '.r-aff--free', app: '[data-cy="round-draw-pairing-3"]' },
  { name: 'ti-vivier-haut', mockup: '.tir-side > section:nth-child(1)', app: '[data-cy="round-draw-pool"]', upTo: { mockup: 'p[role="status"]', app: '.round-draw-side__status' } },
  { name: 'ti-a-placer-entete', mockup: '.tir-side > section:nth-child(2) .adm-card-h', app: '.round-draw-side__head' },
  { name: 'ti-validation', mockup: '.q-sec .q-act', app: '.round-draw-recap__action' }
]

for (const viewport of VIEWPORTS) {
  test.describe(`F-25 tirage du tour, une affiche tirée @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser, context }) => {
        await signIn(context, 'admin')
        const edition = await createQualifiedEdition(context.request, `f25z${zone.name.slice(3, 6)}${viewport.name}`, 4)
        await selectAdminEdition(context, edition)
        const preview = await (await context.request.get(`/api/v1/admin/editions/${edition.id}/tirages/tour`)).json() as { candidates: Array<{ participationId: string }> }
        const draft = await (await context.request.post(`/api/v1/editions/${edition.id}/tirages/tour`, { data: {} })).json() as { id: string }
        await context.request.put(`/api/v1/tirages/${draft.id}/affectations`, { data: { assignments: [
          { participationId: preview.candidates[0]!.participationId, pairingIndex: 1, sidePosition: 1, drawnOrder: 1 },
          { participationId: preview.candidates[1]!.participationId, pairingIndex: 1, sidePosition: 2, drawnOrder: 2 }
        ] } })
        const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
        const mockup = await mockContext.newPage()
        await mockup.goto(`file://${MOCKUP_DIR}/admin-tirage-tour.html`)
        await settle(mockup)
        await page.goto(PAGE)
        await hydrated(page)
        await page.getByTestId('round-draw-pairing-1').waitFor()
        await settle(page)
        await mockup.addStyleTag({ content: '.adm-bottom { display: none !important; }' })
        await page.addStyleTag({ content: '.admin-bottom { display: none !important; }' })
        await alignMockupText(mockup, page, [
          { mockup: '.adm-head .eyebrow', app: '.admin-round-draw__eyebrow' },
          { mockup: '.tir-main > header h2', app: '.round-draw-head__title' },
          { mockup: '.tir-main > header .muted', app: '[data-cy="round-draw-count"]' },
          { mockup: '.tir-main .r-round', app: '[data-cy="round-draw-round"]' },
          { mockup: '.r-affs > li:nth-child(1) .r-aff__row b', app: '[data-cy="round-draw-pairing-1"] .round-draw-entry__row b' },
          { mockup: '.tir-side > section:nth-child(1) p[role="status"]', app: '.round-draw-side__status' },
          { mockup: '.tir-side > section:nth-child(1) h2', app: '.round-draw-side__title' },
          { mockup: '.tir-side > section:nth-child(2) .chip', app: '.round-draw-side__head .origam-chip' },
          { mockup: '.r-aff--next .eyebrow', app: '[data-cy="round-draw-pairing-2"] .round-draw-entry__eyebrow' },
          { mockup: '.r-aff--next .r-aff__row > span:first-child .sel-field__label', app: '[data-cy="round-draw-select-2-1"] .origam-label' },
          { mockup: '.r-aff--next .r-aff__row > span:last-child .sel-field__label', app: '[data-cy="round-draw-select-2-2"] .origam-label' },
          { mockup: '.q-sec .q-act .btn', app: '[data-cy="round-draw-validate-open"]' },
          { mockup: '.q-sec .q-why', app: '[data-cy="round-draw-validate-why"]' }
        ])
        await hideInk(mockup, ['.adm-head .eyebrow', '.r-affs > li:nth-child(1) .r-aff__row b', '.tir-main .r-round', '.q-sec .q-act .btn', '.r-aff--next .eyebrow'])
        await hideInk(page, ['.admin-round-draw__eyebrow', '[data-cy="round-draw-pairing-1"] .round-draw-entry__row b', '[data-cy="round-draw-round"]', '[data-cy="round-draw-validate-open"]', '[data-cy="round-draw-pairing-2"] .round-draw-entry__eyebrow'])
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await alignToPixel(mockup, zone.mockup)
        await alignToPixel(page, zone.app)
        const mockBox = zone.upTo ? await boxTo(mockup, zone.mockup, zone.upTo.mockup) : await box(mockup, zone.mockup)
        const appBox = zone.upTo ? await boxTo(page, zone.app, zone.upTo.app) : await box(page, zone.app)
        await compare(page, mockup, zone.name, viewport.name, mockBox, appBox, zone.masks ?? NO_MASKS)
        await mockContext.close()
      })
    }
  })
}

for (const viewport of VIEWPORTS) {
  test.describe(`F-25 tirage des barrages, carte d'état @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('ti-barrages-carte', async ({ page, browser, context }) => {
      await signIn(context, 'admin')
      const edition = await createQualifiedEdition(context.request, `f25zbar${viewport.name}`, 4, true, 3)
      await selectAdminEdition(context, edition)
      const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
      const mockup = await mockContext.newPage()
      await mockup.goto(`file://${MOCKUP_DIR}/admin-tirage-tour.html`)
      await settle(mockup)
      await page.goto(PAGE)
      await hydrated(page)
      await page.getByTestId('round-draw-playoff-wait').waitFor()
      await settle(page)
      await mockup.addStyleTag({ content: '.adm-bottom { display: none !important; }' })
      await page.addStyleTag({ content: '.admin-bottom { display: none !important; }' })
      await alignMockupText(mockup, page, [
        { mockup: '.r-playoff .h-card', app: '#round-draw-title' },
        { mockup: '.r-playoff > p.muted', app: '[data-cy="round-draw-playoff-wait"]' }
      ])
      // Compteur et ligne du tour sont des valeurs (nombres de joueurs, « Barrages » en gras) : encrées ; leur typographie est comparée par ti-saisie-titre et ti-tour.
      await hideInk(mockup, ['.r-playoff header .muted', '.r-playoff .r-round'])
      await hideInk(page, ['[data-cy="round-draw-playoff"] [data-cy="round-draw-count"]', '[data-cy="round-draw-playoff"] [data-cy="round-draw-round"]'])
      await mockup.evaluate(() => window.scrollTo(0, 0))
      await page.evaluate(() => window.scrollTo(0, 0))
      await alignToPixel(mockup, '.r-playoff')
      await alignToPixel(page, '[data-cy="round-draw-playoff"]')
      await compare(page, mockup, 'ti-barrages-carte', viewport.name, await box(mockup, '.r-playoff'), await box(page, '[data-cy="round-draw-playoff"]'), NO_MASKS)
      await mockContext.close()
    })
  })
}
