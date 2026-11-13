import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createDrawnEdition, createTiedPoolsEdition, playMatch, selectAdminEdition } from '../helpers/edition-write'
import type { IAdminMatchView } from '../helpers/edition-write'
import { alignToPixel } from '../helpers/home-visual'
import { signIn } from '../helpers/session'
import { alignMockupText, box, compare, MOCKUP_DIR, settle } from '../visual.util'
import type { IDataMasks } from '../visual.util'

/*********************************************************
 * F-24 : zones visuelles de la qualification (admin-qualification.html)
 *
 * @description
 * Pourquoi `writes/` et non `visual/` : l'écran se mesure sur des éditions créées par le test (QA-3, jamais 2026), dans trois états que la base de test n'a pas :
 * « égalité » (3 poules de 2, une égalité entre poules à 3 joueurs : étapes Fait, Active, À venir, À venir comme la maquette), « prête » (aucune égalité, dialogue d'arrêt)
 * et « matchs à valider » (carte « Poules à jour »). Les VALEURS (noms, nombres, textes de données) sont rendues transparentes des deux côtés, ou recopiées de l'application
 * dans la maquette (`alignMockupText`) ; gabarit, filets, pastilles, rayons, boutons restent comparés. Non comparés, parce qu'aucun état réel ne reproduit leur contenu
 * (la maquette montre 6 joueurs, 2 égalités dont une avec des matchs encore à valider) : le classement, la liste des égalités et l'aperçu des qualifiés.
 * Ils sont couverts par les tests de composant, les e2e fonctionnels et l'axe (`F-24.spec.ts`).
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]
const PAGE = '/admin/phase-finale/qualification'
/** Cale sur une ligne de pixels entière le haut de `anchor` en déplaçant `shift` : le texte démarre alors au même endroit des deux côtés, sans seuil d'arrondi à une fraction près. */
const alignAnchorToPixel = async (page: Page, shift: string, anchor: string) => {
  await page.evaluate(([shiftSelector, anchorSelector]) => {
    const element = document.querySelector(shiftSelector as string) as HTMLElement
    const top = (document.querySelector(anchorSelector as string) as HTMLElement).getBoundingClientRect().top + window.scrollY
    element.style.marginTop = `calc(${getComputedStyle(element).marginTop} + ${Math.ceil(top) - top}px)`
  }, [shift, anchor])
}

/** Cale la fraction de pixel du haut de `mockAnchor` sur celle de `appAnchor` en déplaçant `shift` de la maquette (moins d'un pixel, aucun gabarit touché). */
const alignFractionTo = async (mockup: Page, shift: string, mockAnchor: string, page: Page, appAnchor: string) => {
  const appTop = await page.locator(appAnchor).evaluate(element => element.getBoundingClientRect().top + window.scrollY)
  await mockup.evaluate(([shiftSelector, anchorSelector, top]) => {
    const element = document.querySelector(shiftSelector as string) as HTMLElement
    const own = (document.querySelector(anchorSelector as string) as HTMLElement).getBoundingClientRect().top + window.scrollY
    element.style.marginTop = `calc(${getComputedStyle(element).marginTop} + ${Math.round((((top as number) % 1) - (own % 1)) * 64) / 64}px)`
  }, [shift, mockAnchor, appTop])
}

const NO_MASKS: IDataMasks = { mockup: [], app: [] }
const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'

const hideInk = async (page: Page, selectors: string[]) => {
  await page.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

const hideBottomBars = async (mockup: Page, page: Page) => {
  await mockup.addStyleTag({ content: '.adm-bottom { display: none !important; }' })
  await page.addStyleTag({ content: '.admin-bottom { display: none !important; }' })
}

const open = async (page: Page, browser: Parameters<Parameters<typeof test>[2]>[0]['browser'], viewport: { width: number, height: number }) => {
  const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  const mockup = await mockContext.newPage()
  await mockup.goto(`file://${MOCKUP_DIR}/admin-qualification.html`)
  await settle(mockup)
  return { mockup, mockContext }
}

const adminMatches = async (page: Page, editionId: string): Promise<IAdminMatchView[]> =>
  (await (await page.request.get(`/api/v1/admin/editions/${editionId}/matchs`)).json()) as IAdminMatchView[]

for (const viewport of VIEWPORTS) {
  test.describe(`F-24 qualification, égalité entre poules @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    const ZONES = [
      { name: 'qa-phase', mockup: '.ostep--phase', app: '[data-cy="phase-steps"]' },
      { name: 'qa-entete', mockup: '.adm-head', app: '.admin-qualification__head' },
      { name: 'qa-etapes', mockup: 'nav[aria-label="Étapes de la qualification"]', app: '[data-cy="draw-steps"]' },
      { name: 'qa-parametres', mockup: 'section[aria-labelledby="h-par"]', app: '[data-cy="qualification-parameters"]' }
    ]

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser, context }) => {
        await signIn(context, 'admin')
        const { edition } = await createTiedPoolsEdition(context.request, `f24z${zone.name.slice(3, 6)}${viewport.name}`, 3)
        await selectAdminEdition(context, edition)
        const { mockup, mockContext } = await open(page, browser, viewport)
        await page.goto(PAGE)
        await hydrated(page)
        await page.getByTestId('qualification-top-per-pool').locator('input').fill('1')
        await page.getByTestId('qualification-best-next').locator('input').fill('1')
        await page.getByTestId('qualification-tie-0').waitFor()
        await settle(page)
        await hideBottomBars(mockup, page)
        await alignMockupText(mockup, page, [
          { mockup: '.adm-head .eyebrow', app: '.admin-qualification__eyebrow' },
          { mockup: '.q-preview b', app: '[data-cy="qualification-preview"] strong' },
          { mockup: '.q-preview .muted', app: '[data-cy="qualification-preview"] span' }
        ])
        await hideInk(mockup, ['.adm-head .eyebrow', '.q-preview', 'input.input'])
        await hideInk(page, ['.admin-qualification__eyebrow', '[data-cy="qualification-preview"]', '[data-cy="qualification-parameters"] input'])
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await alignToPixel(mockup, zone.mockup)
        await alignToPixel(page, zone.app)
        await compare(page, mockup, zone.name, viewport.name, await box(mockup, zone.mockup), await box(page, zone.app), NO_MASKS)
        await mockContext.close()
      })
    }
  })

  test.describe(`F-24 qualification, poules à jour @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('qa-poules-a-jour', async ({ page, browser, context }) => {
      await signIn(context, 'admin')
      const { edition } = await createDrawnEdition(context.request, `f24zpre${viewport.name}`, 4, 2)
      await selectAdminEdition(context, edition)
      await playMatch(context.request, (await adminMatches(page, edition.id))[0]!, [5, 2])
      const { mockup, mockContext } = await open(page, browser, viewport)
      await page.goto(PAGE)
      await hydrated(page)
      await page.getByTestId('qualification-prerequisites').waitFor()
      await settle(page)
      await hideBottomBars(mockup, page)
      await alignMockupText(mockup, page, [
        { mockup: '.q-pre .adm-card-h .chip', app: '[data-cy="qualification-prerequisites-count"]' },
        { mockup: '.q-pre a.btn', app: '[data-cy="qualification-matches-link"]' }
      ])
      const percent = await page.getByTestId('qualification-prerequisites-progress').getAttribute('aria-valuenow')
      await mockup.addStyleTag({ content: `.q-pre .progress span { --p: ${percent ?? 0} !important; }` })
      await hideInk(mockup, ['.q-pre .chip'])
      await hideInk(page, ['[data-cy="qualification-prerequisites-count"]'])
      await mockup.evaluate(() => window.scrollTo(0, 0))
      await page.evaluate(() => window.scrollTo(0, 0))
      await alignToPixel(mockup, '.q-pre')
      await alignToPixel(page, '[data-cy="qualification-prerequisites"]')
      await compare(page, mockup, 'qa-poules-a-jour', viewport.name, await box(mockup, '.q-pre'), await box(page, '[data-cy="qualification-prerequisites"]'), NO_MASKS)
      await mockContext.close()
    })
  })

  test.describe(`F-24 qualification, arrêt de la liste @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('qa-dialogue', async ({ page, browser, context }) => {
      await signIn(context, 'admin')
      const { edition } = await createTiedPoolsEdition(context.request, `f24zdlg${viewport.name}`, 3)
      await selectAdminEdition(context, edition)
      const { mockup, mockContext } = await open(page, browser, viewport)
      await page.goto(PAGE)
      await hydrated(page)
      await page.getByTestId('qualification-qualified').waitFor()
      await page.getByTestId('qualification-finalize-open').click()
      const dialog = page.getByTestId('qualification-finalize-dialog')
      await dialog.waitFor()
      // Derrière les angles arrondis du dialogue, l'application montre sa page sous le voile, la maquette son fond : on rend le voile et la page transparents pour comparer la carte seule.
      await page.addStyleTag({ content: '*, *::before, *::after { caret-color: transparent !important; transition: none !important; animation: none !important; } .origam-scrim { display: none !important; } #__nuxt { visibility: hidden !important; }' })
      await page.evaluate(() => document.fonts.ready)
      await alignMockupText(mockup, page, [{ mockup: '#dq-d', app: '[data-cy="qualification-finalize-dialog"] .confirm-dialog__text' }])
      // Le dialogue de la maquette est dans la page (largeur du contenu, 358 px à 390) ; celui d'Origam est un calque centré avec 24 px de marge de chaque côté (342 px) : on prend sa largeur.
      const card = '[data-cy="qualification-finalize-dialog"] .origam-card'
      const appWidth = (await box(page, card)).width
      await mockup.addStyleTag({ content: `.odlg { margin-top: 0 !important; width: ${appWidth}px !important; }` })
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
      await page.evaluate(() => window.scrollTo(0, 0))
      // Origam centre son dialogue (haut à une fraction de pixel, calque composité) ; celui de la maquette est dans la page. Selon la largeur, le texte bascule d'une ligne de pixels d'un côté
      // seulement : à 1440 le calage sur la fraction de pixel de l'application donne 0,03 %, à 390 il laisse deux lignes sur un seuil d'arrondi (2,1 %), et le calage du texte sur une ligne
      // entière donne 0,55 % (mais 1,8 % à 1440). Mêmes boîtes, mesurées à 0,001 px : on prend, par largeur, le calage qui évite le seuil.
      const textAnchor = '[data-cy="qualification-finalize-dialog"] .confirm-dialog__text'
      if (viewport.width >= 1000) {
        await alignFractionTo(mockup, '.odlg', '#dq-d', page, textAnchor)
      } else {
        await alignAnchorToPixel(mockup, '.odlg', '#dq-d')
        await alignAnchorToPixel(page, '.origam-overlay__content', textAnchor)
      }
      await compare(page, mockup, 'qa-dialogue', viewport.name, await box(mockup, '.odlg'), await box(page, card), NO_MASKS)
      await mockContext.close()
    })
  })
}
