import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createMultiTiebreakEdition, selectAdminEdition } from '../helpers/edition-write'
import { alignToPixel } from '../helpers/home-visual'
import { signIn } from '../helpers/session'
import { alignMockupText, box, compare, MOCKUP_DIR, settle } from '../visual.util'
import type { IDataMasks } from '../visual.util'

/*********************************************************
 * F-21 : zones visuelles du départage à 3 et 4 côtés (admin-matchs.html?multi=3 et ?multi=4)
 *
 * @description
 * Pourquoi `writes/` et non `visual/` : l'écran se mesure sur une édition et un départage créés par le test (QA-3, jamais 2026).
 * Deux états : 3 côtés SAISIS (carte « Saisi · à valider » + bouton « Valider », comme la 1re carte `.mc--multi` de la maquette) et
 * 4 côtés SANS SCORE (carte « Sans score » + « Saisir », comme la 2e). Les VALEURS (noms, n° de match, scores) sont rendues
 * transparentes des deux côtés : gabarit, filets, pastilles, rayons et boutons restent comparés. Le dialogue est comparé ouvert,
 * champs remplis comme dans la maquette (3-1-0 ou 3-1-0-2), noms de l'application recopiés dans la maquette (`alignMockupText`).
 * Seul le FORMULAIRE est comparé (du premier champ aux boutons), pas l'en-tête du dialogue : l'en-tête est celui de F-08 (voir le compte rendu de F-21).
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]
const STATES = [
  { sideCount: 3, scores: [3, 1, 0], cardIndex: 0 },
  { sideCount: 4, scores: [] as number[], cardIndex: 1 }
]

const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'
const hideInk = async (page: Page, selectors: string[]) => {
  await page.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

/**
 * Le dialogue de la maquette est centré par `translate: -50% -50%` : sa hauteur (709,7 px à 3 côtés) donne un haut de formulaire à une
 * fraction de pixel que l'application n'a pas (0,4 px d'écart mesuré). Le texte se rastérise alors différemment sur deux positions
 * pourtant identiques en gabarit. On recale la maquette sur le haut du formulaire de l'application (moins d'un pixel, aucun gabarit touché).
 */
const alignSubPixel = async (mockup: Page, mockSheet: string, mockAnchor: string, page: Page, appAnchor: string) => {
  const appTop = await page.locator(appAnchor).evaluate(element => element.getBoundingClientRect().top + window.scrollY)
  await mockup.evaluate(([sheetSelector, anchorSelector, top]) => {
    const sheet = document.querySelector(sheetSelector as string) as HTMLElement
    const anchor = document.querySelector(anchorSelector as string) as HTMLElement
    const delta = (top as number) - (anchor.getBoundingClientRect().top + window.scrollY)
    sheet.style.marginTop = `calc(${getComputedStyle(sheet).marginTop} + ${delta}px)`
  }, [mockSheet, mockAnchor, appTop])
}

const NO_MASKS: IDataMasks = { mockup: [], app: [] }

for (const viewport of VIEWPORTS) {
  for (const state of STATES) {
    test.describe(`F-21 départage à ${state.sideCount} côtés @${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      test('matchs-multi-carte', async ({ page, browser, context }) => {
        await signIn(context, 'admin')
        const { edition, tiebreak } = await createMultiTiebreakEdition(context.request, `f21c${state.sideCount}${viewport.name}`, state.sideCount)
        if (state.scores.length > 0) {
          await context.request.put(`/api/v1/matchs/${tiebreak.id}/score`, {
            data: { scores: tiebreak.sides.map((side, index) => ({ participationId: side.participationId, score: state.scores[index] })) },
            headers: { 'If-Match': `"${tiebreak.version}"` }
          })
        }
        await selectAdminEdition(context, edition)
        const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
        const mockup = await mockContext.newPage()
        await mockup.goto(`file://${MOCKUP_DIR}/admin-matchs.html?multi=${state.sideCount}`)
        await settle(mockup)
        await mockup.addStyleTag({ content: '.mcs { align-items: start; } .adm-bottom { display: none !important; }' })
        await page.goto('/admin/matchs')
        await settle(page)
        const mockCard = `.mcs > .mc--multi:nth-of-type(${state.cardIndex + 3})`
        await alignMockupText(mockup, page, [
          { mockup: `${mockCard} .mc__t`, app: '.match-queue__title' },
          { mockup: `${mockCard} .mc__n`, app: '.match-queue__side-name' }
        ])
        await page.addStyleTag({ content: '.admin-bottom { display: none !important; }' })
        await hideInk(mockup, ['.mc--multi .mc__t', '.mc--multi .mc__n', '.mc--multi .mc__v'])
        await hideInk(page, ['.match-queue__title', '.match-queue__side-name', '.match-queue__side-score'])
        await alignToPixel(mockup, mockCard)
        await alignToPixel(page, `[data-cy="admin-match-${tiebreak.id}"]`)
        const mockBox = await box(mockup, mockCard)
        const appBox = await box(page, `[data-cy="admin-match-${tiebreak.id}"]`)
        await compare(page, mockup, `matchs-multi-carte-${state.sideCount}`, viewport.name, mockBox, appBox, NO_MASKS)
        await mockContext.close()
      })

      test('matchs-multi-saisie', async ({ page, browser, context }) => {
        await signIn(context, 'admin')
        const { edition, tiebreak } = await createMultiTiebreakEdition(context.request, `f21s${state.sideCount}${viewport.name}`, state.sideCount)
        await selectAdminEdition(context, edition)
        const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
        const mockup = await mockContext.newPage()
        await mockup.goto(`file://${MOCKUP_DIR}/admin-matchs.html?multi=${state.sideCount}`)
        await mockup.evaluate(() => document.fonts.ready)
        await mockup.addStyleTag({ content: '.sheet-scrim { display: none !important; } .sheet { animation: none !important; }' })
        await page.goto('/admin/matchs')
        await hydrated(page)
        await page.locator(`[data-cy="admin-match-enter-${tiebreak.id}"]`).click()
        await page.locator('[data-cy="admin-score-form"]').waitFor()
        const scores = [3, 1, 0, 2].slice(0, state.sideCount)
        for (const [index, score] of scores.entries()) {
          await page.locator(`[data-cy="admin-score-input-${index}"] input`).fill(String(score))
        }
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.addStyleTag({ content: '*, *::before, *::after { caret-color: transparent !important; transition: none !important; animation: none !important; }' })
        await page.evaluate(() => document.fonts.ready)
        await alignMockupText(mockup, page, [
          { mockup: '.sheet__h .eyebrow', app: '[role=dialog] .origam-card-header__subtitle' },
          { mockup: '.multi__p:not([hidden]) label', app: '[role=dialog] .score-entry-form__name' },
          { mockup: '.sheet__meta', app: '[data-cy="admin-score-meta"]' }
        ])
        await alignSubPixel(mockup, '.sheet', '.multi', page, '[data-cy="admin-score-form"]')
        const multiBox = await box(mockup, '.multi')
        const ctaBox = await box(mockup, '.sheet__cta')
        const mockBox = { x: multiBox.x, y: multiBox.y, width: multiBox.width, height: ctaBox.y + ctaBox.height - multiBox.y }
        const appBox = await box(page, '[data-cy="admin-score-form"]')
        await compare(page, mockup, `matchs-multi-saisie-${state.sideCount}`, viewport.name, mockBox, appBox, NO_MASKS)
        await mockContext.close()
      })
    })
  }
}

/*********************************************************
 * Liste publique des matchs : un départage à 3 côtés (edition.html?matchs=departage)
 *
 * @description
 * Le tableau de la maquette porte 16 lignes d'une édition illustrative, l'application celles de l'édition créée par le test : seule la ligne du
 * départage est comparée. Les autres lignes sont masquées des deux côtés, N°, tour et noms de l'application sont recopiés dans la maquette
 * (mêmes largeurs de colonnes), puis l'encre des valeurs est rendue transparente. Gabarit, colonnes, liste des adversaires et pastille restent comparés.
 ********************************************************/
const ROW = '[data-cy="edition-matches-table"] tbody tr:has(.edition-matches__others li + li)'
for (const viewport of VIEWPORTS) {
  test.describe(`F-21 liste publique des matchs, départage à 3 côtés @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('matchs-public-departage', async ({ page, browser, context }) => {
      await signIn(context, 'admin')
      const { edition, tiebreak } = await createMultiTiebreakEdition(context.request, `f21p${viewport.name}`, 3)
      const scores = { scores: tiebreak.sides.map((side, index) => ({ participationId: side.participationId, score: [3, 1, 0][index] })) }
      const recorded = await (await context.request.put(`/api/v1/matchs/${tiebreak.id}/score`, { data: scores, headers: { 'If-Match': `"${tiebreak.version}"` } })).json() as { version: number }
      await context.request.post(`/api/v1/matchs/${tiebreak.id}/validation`, { data: scores, headers: { 'If-Match': `"${recorded.version}"` } })
      const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
      const mockup = await mockContext.newPage()
      await mockup.goto(`file://${MOCKUP_DIR}/edition.html?matchs=departage`)
      await settle(mockup)
      await page.goto(`/editions/${edition.code}?onglet=matchs`)
      await settle(page)
      await mockup.addStyleTag({ content: '#ed-p-mat tbody tr:not(.m-tb) { display: none !important; } .stars { display: none !important; }' })
      await page.addStyleTag({ content: `[data-cy="edition-matches-table"] tbody tr:not(:has(.edition-matches__others li + li)) { display: none !important; }` })
      await alignMockupText(mockup, page, [
        { mockup: '#ed-p-mat .m-tb td:nth-child(1)', app: `${ROW} td:nth-child(1)` },
        { mockup: '#ed-p-mat .m-tb td:nth-child(2)', app: `${ROW} td:nth-child(2)` },
        { mockup: '#ed-p-mat .m-tb td:nth-child(3) a', app: `${ROW} td:nth-child(3) .player-link__name` },
        { mockup: '#ed-p-mat .m-tb .opp-list a', app: `${ROW} .edition-matches__others .player-link__name` }
      ])
      await hideInk(mockup, ['#ed-p-mat .m-tb td:nth-child(1)', '#ed-p-mat .m-tb td:nth-child(2)', '#ed-p-mat .m-tb a'])
      await hideInk(page, ['[data-cy="edition-matches-table"] tbody td:nth-child(1)', '[data-cy="edition-matches-table"] tbody td:nth-child(2)', '[data-cy="edition-matches-table"] tbody .player-link__name'])
      await mockup.evaluate(() => window.scrollTo(0, 0))
      await page.evaluate(() => window.scrollTo(0, 0))
      const columns = (target: Page, selector: string) => target.locator(selector).evaluateAll(cells => cells.map(cell => Number(cell.getBoundingClientRect().width.toFixed(1))))
      console.log(`COLONNES ${viewport.name} maquette ${(await columns(mockup, '#ed-p-mat .m-tb td')).join(' / ')} | app ${(await columns(page, `${ROW} td`)).join(' / ')}`)
      const mockBox = await box(mockup, '#ed-p-mat .table-wrap')
      const appBox = await box(page, '[data-cy="edition-matches-scroll"]')
      await compare(page, mockup, 'matchs-public-departage', viewport.name, mockBox, appBox, NO_MASKS)
      await mockContext.close()
    })
  })
}

