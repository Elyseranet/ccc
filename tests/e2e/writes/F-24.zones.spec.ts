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
const DIALOG_TEXT_FRACTION = 0.4
/**
 * Cale le haut de `anchor` à `fraction` de pixel en déplaçant `shift` (moins d'un pixel, aucun gabarit touché). Le dialogue d'Origam est centré dans un calque composité, celui de la maquette
 * est dans la page : à une position quelconque, une ligne de texte tombe parfois pile sur un seuil d'arrondi et bascule d'un pixel d'un côté seulement (hauteur de ligne 24,797 px). On pose
 * donc les deux textes à la même fraction, choisie loin des seuils pour les quatre lignes.
 */
const alignAnchorTo = async (page: Page, shift: string, anchor: string, fraction: number) => {
  await page.evaluate(([shiftSelector, anchorSelector, target]) => {
    const element = document.querySelector(shiftSelector as string) as HTMLElement
    const top = (document.querySelector(anchorSelector as string) as HTMLElement).getBoundingClientRect().top + window.scrollY
    const delta = ((((target as number) - (top % 1)) % 1) + 1) % 1
    element.style.marginTop = `calc(${getComputedStyle(element).marginTop} + ${delta}px)`
  }, [shift, anchor, fraction])
}

/** Boîte du haut d'un conteneur au bas de son premier élément `end`. */
const boxTo = async (page: Page, container: string, end: string) => page.evaluate(([containerSelector, endSelector]) => {
  const root = document.querySelector(containerSelector as string) as HTMLElement
  const last = root.querySelector(endSelector as string) as HTMLElement
  const a = root.getBoundingClientRect()
  const b = last.getBoundingClientRect()
  return { x: a.left + window.scrollX, y: a.top + window.scrollY, width: a.width, height: b.bottom - a.top }
}, [container, end])

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

    const ZONES: Array<{ name: string, mockup: string, app: string, upTo?: { mockup: string, app: string }, masks?: IDataMasks }> = [
      { name: 'qa-phase', mockup: '.ostep--phase', app: '[data-cy="phase-steps"]' },
      { name: 'qa-entete', mockup: '.adm-head', app: '.admin-qualification__head' },
      { name: 'qa-etapes', mockup: 'nav[aria-label="Étapes de la qualification"]', app: '[data-cy="draw-steps"]' },
      { name: 'qa-parametres', mockup: 'section[aria-labelledby="h-par"]', app: '[data-cy="qualification-parameters"]' },
      // Parties de la liste des égalités, du classement et de l'aperçu qui ne dépendent pas des données (valeurs masquées ou recopiées) : titre de section, haut d'une carte d'égalité
      // (aperçu, joueurs et description ; la suite diffère : la maquette est dans un état « matchs à valider », bouton inactif avec sa raison), en-tête du classement,
      // état vide de l'aperçu des qualifiés.
      { name: 'qa-egalites-titre', mockup: 'section[aria-labelledby="h-eg"] > header', app: '.qualification-ties__head' },
      { name: 'qa-egalite-haut', mockup: '.q-ties > li:nth-child(2)', app: '[data-cy="qualification-tie-0"]', upTo: { mockup: 'p.muted', app: '.qualification-ties__muted' } },
      { name: 'qa-classement-entete', mockup: '.q-rank .adm-card-h', app: '.qualification-ranking__head', masks: { mockup: [], app: [], values: { mockup: ['.q-rank__sel .input'], app: ['.qualification-ranking__select'] } } },
      { name: 'qa-apercu-vide', mockup: '.q-empty p.muted', app: '[data-cy="qualification-qualified-empty"]' }
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
        await mockup.addStyleTag({ content: '.q-rank .table-wrap { overflow: visible; }' })
        await alignMockupText(mockup, page, [
          { mockup: '.adm-head .eyebrow', app: '.admin-qualification__eyebrow' },
          { mockup: 'section[aria-labelledby="h-eg"] > header [role="status"]', app: '[data-cy="qualification-ties-count"]' },
          { mockup: '.q-ties > li:nth-child(2) .eyebrow', app: '[data-cy="qualification-tie-0"] .qualification-ties__eyebrow' },
          { mockup: '.q-ties > li:nth-child(2) .q-tie__who', app: '[data-cy="qualification-tie-0"] .qualification-ties__who' },
          { mockup: '.q-preview b', app: '[data-cy="qualification-preview"] strong' },
          { mockup: '.q-preview .muted', app: '[data-cy="qualification-preview"] span' }
        ])
        await hideInk(mockup, ['.adm-head .eyebrow', '.q-preview', 'input.input', '.q-ties > li:nth-child(2) .eyebrow', '.q-ties > li:nth-child(2) .q-tie__who', '.q-rank .table tbody', 'section[aria-labelledby="h-eg"] > header [role="status"]'])
        await hideInk(page, ['.admin-qualification__eyebrow', '[data-cy="qualification-preview"]', '[data-cy="qualification-parameters"] input', '[data-cy="qualification-tie-0"] .qualification-ties__eyebrow', '[data-cy="qualification-tie-0"] .qualification-ties__who', '[data-cy="qualification-ranking"] tbody', '[data-cy="qualification-ties-count"]'])
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await alignToPixel(mockup, zone.mockup)
        await alignToPixel(page, zone.app)
        const mockBox = zone.upTo ? await boxTo(mockup, zone.mockup, zone.upTo.mockup) : await box(mockup, zone.mockup)
        const appBox = zone.upTo ? await boxTo(page, zone.app, zone.upTo.app) : await box(page, zone.app)
        if (zone.name === 'qa-apercu-vide') {
          // La maquette montre cet état dans une carte dont le texte tient sa largeur propre ; dans l'application il est dans la carte « 4 · Arrêter la liste ». Seul le texte est comparé : même largeur de boîte.
          appBox.width = mockBox.width
        }
        await compare(page, mockup, zone.name, viewport.name, mockBox, appBox, zone.masks ?? NO_MASKS)
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
      const textAnchor = '[data-cy="qualification-finalize-dialog"] .confirm-dialog__text'
      await alignAnchorTo(mockup, '.odlg', '#dq-d', DIALOG_TEXT_FRACTION)
      await alignAnchorTo(page, '.origam-overlay__content', textAnchor, DIALOG_TEXT_FRACTION)
      await compare(page, mockup, 'qa-dialogue', viewport.name, await box(mockup, '.odlg'), await box(page, card), NO_MASKS)
      await mockContext.close()
    })
  })
}
