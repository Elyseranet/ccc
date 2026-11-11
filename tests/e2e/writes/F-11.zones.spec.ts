import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { attachParticipant, createCompetitor, createRegistrationEdition, selectAdminEdition } from '../helpers/edition-write'
import type { IWriteEdition, IWriteParticipant } from '../helpers/edition-write'
import { signIn } from '../helpers/session'
import { alignMockupText, box, compare, open } from '../visual.util'
import type { IClip, ITextPair } from '../visual.util'

/*********************************************************
 * F-11 : zones visuelles de l'écran Tirage (admin-tirages.html), étape 3 « Saisie du tirage »
 *
 * @description
 * Pourquoi `writes/` et non `visual/` : l'écran se mesure sur une édition créée par le test (QA-3, jamais 2026), avec un tirage
 * en cours construit par l'API réelle. État reproduit : 45 inscrits, 8 poules (5 de 6 joueurs et 3 de 5), 37 joueurs placés,
 * poule 7 en cours (1/5), poule 8 à suivre (1/5), comme dans la maquette. Les VALEURS (noms, initiales, rangs ACP, liste d'édition)
 * sont masquées des deux côtés par de l'encre transparente : gabarit, filets, fonds, rayons et chips restent comparés.
 * La maquette est un aperçu composite (étape 3, bloc « 5 · Validation » désactivé, aperçu de la confirmation) : seuls l'en-tête,
 * le stepper, la saisie et les trois cartes latérales sont comparés, les autres états sont couverts par les e2e fonctionnels
 * (`writes/F-11.spec.ts`). La barre basse fixe (390 px) et le snackbar « Brouillon enregistré » sont masqués des deux côtés.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]
const PLAYERS = 45
const POOLS = 8
const PLACED = 37
const POOL_SIZE_LARGE = 5

interface ISeedProposalView { seeds: Array<{ participationId: string }>, unresolvedTies: string[][] }
interface IDraftView { id: string }

const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'
const hideInk = async (page: Page, selectors: string[]) => {
  await page.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

const MOCKUP_INK = [
  '.adm-head .eyebrow', '.slot b', '.slot--seed b', '.rest li', '.rest li *', '.mini-rank li span:nth-child(2)', '.mini-rank li .num'
]
const APP_INK = [
  '.admin-draws__eyebrow', '.draw-assignment__name', '.draw-assignment__rest-item', '.draw-assignment__rest-item *',
  '.draw-assignment__seeds li span:nth-child(2)', '.draw-assignment__seed-acp'
]

const TEXT_PAIRS: ITextPair[] = [
  { mockup: '.tir-side > section:nth-child(1) .tir-small', app: '[data-cy="draw-side-params"] .draw-assignment__muted' },
  { mockup: '.tir-seeds .tir-small', app: '[data-cy="draw-seeds-list"] .draw-assignment__muted' }
]

const ZONES: Array<{ name: string, mockup: string, app: string }> = [
  { name: 'ti-entete', mockup: '.adm-head', app: '.admin-draws__head' },
  { name: 'ti-saisie', mockup: '.tir-main', app: '.draw-assignment__main' },
  { name: 'ti-parametres', mockup: '.tir-side > section:nth-child(1)', app: '[data-cy="draw-side-params"]' },
  { name: 'ti-a-placer', mockup: '.tir-side > section:nth-child(2)', app: '[data-cy="draw-rest"]' },
  { name: 'ti-tetes', mockup: '.tir-seeds', app: '[data-cy="draw-seeds-list"]' }
]

/** Les 45 inscrits, créés par lots pour ne pas allonger le test (le premier vient du helper). */
const registerPlayers = async (request: APIRequestContext, edition: IWriteEdition, first: IWriteParticipant): Promise<IWriteParticipant[]> => {
  const all: IWriteParticipant[] = [first]
  const BATCH = 5
  for (let start = 1; start < PLAYERS; start += BATCH) {
    const batch = await Promise.all(Array.from({ length: Math.min(BATCH, PLAYERS - start) }, async (_, offset) => {
      const competitor = await createCompetitor(request, `zones tirage ${start + offset}`, { lastName: `Joueur ${String(start + offset).padStart(2, '0')}` })
      return await attachParticipant(request, edition, competitor)
    }))
    all.push(...batch)
  }
  return all
}

/** Brouillon par l'API réelle : têtes de série (égalités RG10 tranchées par les premiers candidats), puis `PLACED` joueurs, poule après poule. */
const buildDraft = async (request: APIRequestContext, edition: IWriteEdition, players: IWriteParticipant[]) => {
  const proposal = await (await request.get(`/api/v1/editions/${edition.id}/tetes-de-serie?poules=${POOLS}`)).json() as ISeedProposalView
  const seatedIds = new Set(proposal.seeds.map(seed => seed.participationId))
  const tied = new Set(proposal.unresolvedTies.flat())
  const seedIds = [
    ...proposal.seeds.map(seed => seed.participationId).filter(id => !tied.has(id)),
    ...proposal.unresolvedTies.flatMap(group => group.slice(0, group.filter(id => seatedIds.has(id)).length))
  ]
  expect(seedIds).toHaveLength(POOLS)
  const created = await request.post(`/api/v1/editions/${edition.id}/tirages/poules`, { data: { poolCount: POOLS, seedCount: POOLS, seeds: seedIds } })
  expect(created.status()).toBe(201)
  const draft = await created.json() as IDraftView
  const others = players.map(player => player.participationId).filter(id => !seedIds.includes(id)).slice(0, PLACED - POOLS)
  const assignments = [
    ...seedIds.map((participationId, index) => ({ participationId, poolNumber: index + 1, drawnOrder: index + 1 })),
    ...others.map((participationId, index) => {
      const pool = Math.floor(index / (POOL_SIZE_LARGE)) + 1
      return { participationId, poolNumber: Math.min(pool, 6), drawnOrder: POOLS + index + 1 }
    })
  ]
  const saved = await request.put(`/api/v1/tirages/${draft.id}/affectations`, { data: { assignments } })
  expect(saved.status()).toBe(200)
}

const clipOf = async (page: Page, selector: string): Promise<IClip> => await box(page, selector)

/**
 * Phase sous-pixel : la maquette et l'application ne placent pas une zone à la même fraction de pixel (hauteurs fractionnaires des blocs
 * qui la précèdent), et Chrome cale la ligne de base du texte sur la grille : le même gabarit donne alors des glyphes décalés d'un pixel.
 * La marge haute de la zone côté application est ajustée de la différence de fraction (jamais d'un pixel entier) avant la mesure.
 */
const alignPhase = async (page: Page, mockup: Page, zone: { mockup: string, app: string }) => {
  const frac = (value: number) => value - Math.floor(value)
  await page.locator(zone.app).first().evaluate((element) => { (element as HTMLElement).style.marginTop = '' })
  const mockY = (await mockup.locator(zone.mockup).first().boundingBox())!.y
  const appY = (await page.locator(zone.app).first().boundingBox())!.y
  const shift = ((frac(mockY) - frac(appY)) % 1 + 1) % 1
  await page.locator(zone.app).first().evaluate((element, value) => { (element as HTMLElement).style.marginTop = `${value}px` }, shift)
}

for (const viewport of VIEWPORTS) {
  test.describe(`F-11 tirage @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('zones de l’étape 3 (saisie du tirage)', async ({ page, browser, context }) => {
      test.setTimeout(300_000)
      await signIn(context, 'admin')
      const { edition, seedParticipation } = await createRegistrationEdition(context.request, `zones tirage ${viewport.name}`)
      const players = await registerPlayers(context.request, edition, seedParticipation)
      await buildDraft(context.request, edition, players)
      await selectAdminEdition(context, edition)
      const { mockup, mockContext } = await open(page, browser, viewport, 'admin-tirages.html', '/admin/tirages')
      await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
      await expect(page.getByTestId('draw-assignment')).toBeVisible()
      await expect(page.getByTestId('draw-progress-text')).toContainText(`${PLACED} / ${PLAYERS}`)
      // La liste des têtes de série vient d'une lecture silencieuse après le montage (reprise d'un brouillon).
      await expect(page.getByTestId('draw-seeds-list').locator('li')).toHaveCount(POOLS)

      await mockup.addStyleTag({ content: '.adm-bottom, .snack { display: none !important; }' })
      await page.addStyleTag({ content: '.admin-bottom, [data-cy="draw-saved"], [data-cy="draw-feedback"] { display: none !important; }' })
      await alignMockupText(mockup, page, TEXT_PAIRS)
      await hideInk(mockup, MOCKUP_INK)
      await hideInk(page, APP_INK)
      await page.evaluate(() => window.scrollTo(0, 0))
      await mockup.evaluate(() => window.scrollTo(0, 0))

      for (const zone of ZONES) {
        await alignPhase(page, mockup, zone)
        await compare(page, mockup, zone.name, viewport.name, await clipOf(mockup, zone.mockup), await clipOf(page, zone.app))
      }
      await mockContext.close()
    })
  })
}
