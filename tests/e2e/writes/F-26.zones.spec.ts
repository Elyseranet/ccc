import { test } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'
import { createFinalValidatedEdition, selectAdminEdition } from '../helpers/edition-write'
import { alignToPixel } from '../helpers/home-visual'
import { signIn } from '../helpers/session'
import { alignMockupText, box, compare, MOCKUP_DIR, settle } from '../visual.util'
import type { IClip } from '../visual.util'

/*********************************************************
 * F-26 : zones visuelles de la clôture (admin-cloture.html)
 *
 * @description
 * Pourquoi `writes/` et non `visual/` : chaque état se mesure sur une édition créée par le test (QA-3, jamais 2026) : prête à clôturer, finale non validée, clôturée par le test
 * (avec date), archive clôturée sans date (closedAt nul, B-22), clôture réussie par l'écran, erreur renvoyée par le serveur. La maquette montre 45 participants : les VALEURS
 * (année, noms, effectif, date) sont recopiées de l'application dans la maquette ou rendues transparentes des deux côtés ; gabarit, filets, rayons, pastilles et boutons restent comparés.
 * Le tableau d'aperçu n'est comparé que jusqu'à son en-tête (le nombre de lignes dépend du résultat de l'édition) ; ses lignes sont couvertes par les tests de composant.
 * Le dialogue de confirmation n'est pas encore comparé : il le sera sous DIALOG-ZONES après le rebase sur F-30 (card/dimensions/boutons < 1 %, texte masqué, typographie par getComputedStyle).
 * Les sélecteurs des parties d'Origam (`.origam-data-list__kv-value`) viennent de la lecture du source et sont à confirmer au premier passage en navigateur.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]
const PAGE = '/admin/phase-finale/cloture'
const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'

enum STATE {
  READY = 'ready',
  BLOCKED = 'blocked',
  CLOSED_DATED = 'closed-dated',
  CLOSED_UNDATED = 'closed-undated',
  SUCCESS = 'success',
  FAILURE = 'failure'
}

const hideInk = async (page: Page, selectors: string[]) => {
  await page.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

/** Boîte du haut d'un conteneur au bas de son premier élément `end`. */
const boxTo = async (page: Page, container: string, end: string): Promise<IClip> => page.evaluate(([containerSelector, endSelector]) => {
  const root = document.querySelector(containerSelector as string) as HTMLElement
  const last = root.querySelector(endSelector as string) as HTMLElement
  const a = root.getBoundingClientRect()
  const b = last.getBoundingClientRect()
  return { x: a.left + window.scrollX, y: a.top + window.scrollY, width: a.width, height: b.bottom - a.top }
}, [container, end])

/** Texte de l'alerte de l'application sans son lien, écrit dans le premier nœud texte de la maquette (le lien de la maquette reste intact). */
const alignLeadText = async (mockup: Page, page: Page, mockupSelector: string, appSelector: string) => {
  const text = await page.evaluate((selector) => {
    const body = document.querySelector(selector)!
    const link = body.querySelector('a')?.textContent ?? ''
    return (body.textContent ?? '').replace(link, '').replace(/\s+/g, ' ').trimStart()
  }, appSelector)
  await mockup.evaluate(([selector, value]) => {
    (document.querySelector(selector as string)!.firstChild as Text).nodeValue = value as string
  }, [mockupSelector, text])
}

const archiveClosed = async (context: BrowserContext) => {
  const list = await (await context.request.get('/api/v1/editions')).json() as Array<{ id: string, code: string, year: number, status: string }>
  for (const item of list.filter(entry => entry.status === 'CLOSED')) {
    const detail = await (await context.request.get(`/api/v1/editions/${item.id}`)).json() as { closedAt: string | null }
    if (detail.closedAt === null) {
      return item
    }
  }
  throw new Error('aucune archive sans date de clôture')
}

const prepare = async (state: STATE, page: Page, context: BrowserContext, label: string) => {
  if (state === STATE.CLOSED_UNDATED) {
    await selectAdminEdition(context, await archiveClosed(context))
    return
  }
  const edition = await createFinalValidatedEdition(context.request, label, state !== STATE.BLOCKED)
  if (state === STATE.CLOSED_DATED) {
    await context.request.post(`/api/v1/editions/${edition.id}/cloture`)
  }
  await selectAdminEdition(context, edition)
  if (state === STATE.SUCCESS || state === STATE.FAILURE) {
    await page.goto(PAGE)
    await hydrated(page)
    if (state === STATE.FAILURE) {
      await page.route('**/api/v1/editions/*/cloture', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ statusCode: 500, message: 'x' }) }))
    }
    await page.getByTestId('closing-open').click()
    await page.getByTestId('closing-code').locator('input').fill(edition.code)
    await page.getByTestId('closing-confirm').click()
  }
}

const STATE_WAIT: Record<STATE, string> = {
  [STATE.READY]: 'closing-open',
  [STATE.BLOCKED]: 'closing-state-blocked',
  [STATE.CLOSED_DATED]: 'closing-state-closed',
  [STATE.CLOSED_UNDATED]: 'closing-state-closed',
  [STATE.SUCCESS]: 'closing-state-success',
  [STATE.FAILURE]: 'closing-failure'
}

interface IZone {
  name: string
  state: STATE
  mockup: string
  app: string
  upTo?: { mockup: string, app: string }
}

const ZONES: IZone[] = [
  { name: 'cl-phase', state: STATE.READY, mockup: '.ostep--phase', app: '[data-cy="phase-steps"]' },
  { name: 'cl-entete', state: STATE.READY, mockup: '.adm-head', app: '.admin-closing__head' },
  { name: 'cl-avant', state: STATE.READY, mockup: '.c-grid > section:nth-child(1)', app: '[data-cy="closing-prerequisites"]' },
  { name: 'cl-effets-titre', state: STATE.READY, mockup: '.c-grid > section:nth-child(2)', app: '[data-cy="closing-effects"]', upTo: { mockup: 'thead', app: 'thead' } },
  { name: 'cl-confirmer', state: STATE.READY, mockup: '.q-sec', app: '[data-cy="closing-section"]', upTo: { mockup: '.q-act', app: '.closing-confirm__action' } },
  { name: 'cl-etat-bloque', state: STATE.BLOCKED, mockup: '.mock-states > div:nth-of-type(1)', app: '[data-cy="closing-state-blocked"]' },
  { name: 'cl-etat-cloturee-date', state: STATE.CLOSED_DATED, mockup: '.mock-states > div:nth-of-type(2)', app: '[data-cy="closing-state-closed"]' },
  { name: 'cl-etat-cloturee-sans-date', state: STATE.CLOSED_UNDATED, mockup: '.mock-states > div:nth-of-type(3)', app: '[data-cy="closing-state-closed"]' },
  { name: 'cl-etat-succes', state: STATE.SUCCESS, mockup: '.mock-states > div:nth-of-type(4)', app: '[data-cy="closing-state-success"]' },
  { name: 'cl-etat-erreur', state: STATE.FAILURE, mockup: '.mock-states > div:nth-of-type(5)', app: '[data-cy="closing-failure"]' }
]

for (const viewport of VIEWPORTS) {
  test.describe(`F-26 clôture @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser, context }) => {
        await signIn(context, 'admin')
        await prepare(zone.state, page, context, `f26z${zone.name.slice(3, 8)}${viewport.name}`)
        const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
        const mockup = await mockContext.newPage()
        await mockup.goto(`file://${MOCKUP_DIR}/admin-cloture.html`)
        await settle(mockup)
        if (zone.state !== STATE.SUCCESS && zone.state !== STATE.FAILURE) {
          await page.goto(PAGE)
          await hydrated(page)
        }
        await page.getByTestId(STATE_WAIT[zone.state]).waitFor()
        await settle(page)
        await mockup.addStyleTag({ content: '.adm-bottom { display: none !important; }' })
        await page.addStyleTag({ content: '.admin-bottom { display: none !important; }' })
        if (zone.state === STATE.READY) {
          await alignMockupText(mockup, page, [
            { mockup: '.adm-head .eyebrow', app: '.admin-closing__eyebrow' },
            { mockup: '.c-pre .chip', app: '[data-cy^="closing-prerequisite-"] .origam-chip' },
            { mockup: '.c-preview caption', app: '[data-cy="closing-preview"] caption' },
            { mockup: '.q-sec .q-act .btn', app: '[data-cy="closing-open"]' }
          ])
          await hideInk(mockup, ['.adm-head .eyebrow', '.c-facts dd', '.c-preview caption', '.c-preview tbody td'])
          await hideInk(page, ['.admin-closing__eyebrow', '.origam-data-list__kv-value', '[data-cy="closing-preview"] caption', '[data-cy="closing-preview"] tbody td'])
        }
        if (zone.state === STATE.CLOSED_DATED) {
          await alignLeadText(mockup, page, '.mock-states > div:nth-of-type(2) .alert__body', '[data-cy="closing-state-closed"] .origam-alert__body')
        }
        if (zone.state === STATE.SUCCESS) {
          await alignMockupText(mockup, page, [{ mockup: '.mock-states > div:nth-of-type(4) .alert__title', app: '[data-cy="closing-state-success"] .origam-alert__title' }])
        }
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await alignToPixel(mockup, zone.mockup)
        await alignToPixel(page, zone.app)
        const mockBox = zone.upTo ? await boxTo(mockup, zone.mockup, zone.upTo.mockup) : await box(mockup, zone.mockup)
        const appBox = zone.upTo ? await boxTo(page, zone.app, zone.upTo.app) : await box(page, zone.app)
        await compare(page, mockup, zone.name, viewport.name, mockBox, appBox, { mockup: [], app: [] })
        await mockContext.close()
      })
    }
  })
}
