import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { useAdminEditionStore } from '../../../src/composables/useAdminEditionStore'
import { ROUTES } from '../../../src/consts/routes.const'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { DRAW_STATUS } from '../../../src/enums/draw.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../../src/enums/round.enum'
import type { IAdminDraw } from '../../../src/interfaces/draw.interface'
import type { IEditionSummary } from '../../../src/interfaces/edition.interface'
import type { IRoundDrawPreview } from '../../../src/interfaces/qualification.interface'
import type { IRound } from '../../../src/interfaces/round.interface'
import RoundDrawEntry from '../../../src/components/admin/round-draw/RoundDrawEntry.vue'
import RoundDrawPage from '../../../src/pages/admin/phase-finale/tirage.vue'
import { standingRow } from '../../helpers/qualification'
import { blocked, draftOf, preview, round } from '../../helpers/round-draw'

const edition = (status: EDITION_STATUS): IEditionSummary => ({
  id: 'e1', code: '2026', year: 2026, name: null, heldOn: null, location: null, status, origin: EDITION_ORIGIN.APP,
  participantCount: null, unidentifiedParticipantCount: null, matchCount: 3, scoredMatchCount: 1, unknownResultMatchCount: 0, champion: null, final: null, semiFinalists: []
} as IEditionSummary)

let editions: IEditionSummary[] = [edition(EDITION_STATUS.PLAYOFFS)]
let current: IRoundDrawPreview = preview(16)
let drafts: IAdminDraw[] = []
let rounds: IRound[] = []
let leaders: string[] = []
let validationFailure: API_ERROR_CODE | null = null
const created = vi.fn()
const saved = vi.fn()
const validated = vi.fn()

registerEndpoint('/api/v1/editions', defineEventHandler(() => editions))
registerEndpoint('/api/v1/editions/e1', defineEventHandler(() => ({
  ...editions[0], rounds, matches: [], draws: [], bracket: [], participants: [],
  pools: [{ id: 'pool-1', rank: 1, standing: leaders.map(id => standingRow(id.replace('part-', ''), id, 1, 3)) }]
})))
registerEndpoint('/api/v1/admin/editions/e1/tirages', defineEventHandler(() => drafts))
registerEndpoint('/api/v1/admin/editions/e1/tirages/tour', defineEventHandler(() => current))
registerEndpoint('/api/v1/editions/e1/tirages/tour', { method: 'POST', handler: defineEventHandler(async (event) => {
  const body = await readBody(event) as { roundKind?: ROUND_KIND }
  created(body)
  const draft = draftOf([], { roundKind: body.roundKind ?? current.roundKind })
  drafts = [draft]
  setResponseStatus(event, 201)
  return draft
}) })
registerEndpoint('/api/v1/tirages/draw-1/affectations', { method: 'PUT', handler: defineEventHandler(async (event) => {
  const body = await readBody(event) as { assignments: Array<[string, number, 1 | 2, number]> & Array<{ participationId: string, pairingIndex: number, sidePosition: 1 | 2, drawnOrder: number }> }
  saved(body)
  drafts = [draftOf(body.assignments.map(entry => [entry.participationId.replace('part-', ''), entry.pairingIndex, entry.sidePosition, entry.drawnOrder]), { roundKind: drafts[0]?.roundKind ?? null })]
  return drafts[0]
}) })
registerEndpoint('/api/v1/tirages/draw-1/validation', { method: 'POST', handler: defineEventHandler((event) => {
  validated()
  if (validationFailure) {
    setResponseStatus(event, 409)
    return { statusCode: 409, code: validationFailure, message: 'x' }
  }
  const draft = { ...drafts[0]!, status: DRAW_STATUS.VALIDATED, validatedAt: '2026-11-13T10:10:00.000Z' }
  drafts = [draft]
  rounds = [round(drafts[0]!.roundKind ?? ROUND_KIND.SEMI, ROUND_STATUS.DRAWN, 2)]
  current = { ...blocked(API_ERROR_CODE.ROUND_NOT_COMPLETED), candidates: current.candidates }
  return draft
}) })

const withRouterLink = { global: { components: { RouterLink } } }
const mounted: Array<{ unmount: () => void }> = []
const mountPage = async () => {
  const wrapper = await mountSuspended(RoundDrawPage, { route: ROUTES.ADMIN_FINAL_PHASE_ROUND_DRAW, attachTo: document.body, ...withRouterLink })
  mounted.push(wrapper)
  return wrapper
}
const body = () => document.body

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

beforeEach(() => {
  editions = [edition(EDITION_STATUS.PLAYOFFS)]
  current = preview(16)
  drafts = []
  rounds = []
  leaders = []
  validationFailure = null
  created.mockClear()
  saved.mockClear()
  validated.mockClear()
  document.body.innerHTML = ''
  clearNuxtData()
  useAdminEditionStore(useNuxtApp().$pinia).editionId = 'e1'
})

describe('états sans saisie (F-25)', () => {
  it('liste des qualifiés non arrêtée : message et lien vers la qualification, rien à saisir', async () => {
    current = preview(8, blocked(API_ERROR_CODE.QUALIFICATION_NOT_DONE))
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-state-qualification-pending"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="round-draw-state-qualification-pending-link"]').attributes('href')).toBe('/admin/phase-finale/qualification')
    expect(wrapper.find('[data-cy="round-draw-entry"]').exists()).toBe(false)
  })

  it('tour précédent inachevé : le nombre de matchs restants et le lien vers les scores filtrés sur ce tour (?tour=)', async () => {
    current = preview(8, blocked(API_ERROR_CODE.ROUND_NOT_COMPLETED))
    rounds = [round(ROUND_KIND.ROUND_OF_16, ROUND_STATUS.PLAYING, 8, 6)]
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-state-previous-incomplete"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="round-draw-state-previous-incomplete"]').text()).toContain('2 restants')
    expect(wrapper.get('[data-cy="round-draw-state-previous-incomplete-link"]').attributes('href')).toBe('/admin/matchs?tour=ROUND_OF_16')
  })

  it('tour tiré dont les matchs sont à jouer : lecture seule, lien vers les scores du tour', async () => {
    current = preview(8, blocked(API_ERROR_CODE.ROUND_NOT_COMPLETED))
    rounds = [round(ROUND_KIND.QUARTER, ROUND_STATUS.DRAWN, 4)]
    drafts = [draftOf([], { status: DRAW_STATUS.VALIDATED, validatedAt: '2026-11-13T10:10:00.000Z' })]
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-state-drawn"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="round-draw-state-drawn"]').text()).toContain('4 matchs créés')
    expect(wrapper.get('[data-cy="round-draw-state-drawn-link"]').attributes('href')).toBe('/admin/matchs?tour=QUARTER')
    expect(wrapper.find('[data-cy="round-draw-recap"]').exists()).toBe(false)
  })

  it('vivier impair : erreur écrite, sans refus « puissance de 2 » (aucun contrôle) ; phase finale jouée : succès', async () => {
    current = preview(15, { roundKind: null, allowedRoundKinds: [] })
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-state-undrawable"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="round-draw-state-undrawable"]').text()).toContain('15 joueurs')
    wrapper.unmount()
    clearNuxtData()
    rounds = [round(ROUND_KIND.FINAL, ROUND_STATUS.COMPLETED, 1, 1)]
    current = preview(2, { roundKind: null, allowedRoundKinds: [] })
    const finished = await mountPage()
    await vi.waitFor(() => expect(finished.find('[data-cy="round-draw-state-finished"]').exists()).toBe(true))
  })

  it('édition clôturée : message dédié', async () => {
    editions = [edition(EDITION_STATUS.CLOSED)]
    current = preview(2, { roundKind: null, allowedRoundKinds: [] })
    rounds = [round(ROUND_KIND.FINAL, ROUND_STATUS.COMPLETED, 1, 1)]
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-closed"]').exists()).toBe(true))
  })
})

describe('saisie du tirage, affiche par affiche (c9790abd (5))', () => {
  it('tour déduit (16 joueurs) : phrase « Tour à tirer », 8 affiches dont une en cours, 16 joueurs à placer, validation inactive avec sa raison', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-entry"]').exists()).toBe(true))
    expect(wrapper.text()).toContain('Saisir le tirage des huitièmes, affiche par affiche')
    expect(wrapper.get('[data-cy="round-draw-round"]').text()).toContain('Tour à tirer : Huitièmes, 16 joueurs.')
    expect(wrapper.get('[data-cy="round-draw-count"]').text()).toBe('0 / 8 affiches · 16 joueurs restants')
    expect(wrapper.findAll('[data-cy^="round-draw-pairing-"]')).toHaveLength(8)
    expect(wrapper.findAll('[data-cy^="round-draw-select-"]')).toHaveLength(2)
    expect(wrapper.findAll('[data-cy="round-draw-rest-item"]')).toHaveLength(16)
    expect(wrapper.get('[data-cy="round-draw-validate-open"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-cy="round-draw-validate-why"]').text()).toBe('Indisponible : 8 affiches restent à saisir.')
    expect(wrapper.text()).toContain('Cible du tour : 10 points.')
  })

  it('un joueur placé : le brouillon est créé puis enregistré (un PUT par joueur), le joueur quitte « À placer » et « Brouillon enregistré » s’affiche', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-entry"]').exists()).toBe(true))
    wrapper.findComponent(RoundDrawEntry).vm.$emit('place', 1, 'part-p3')
    await vi.waitFor(() => expect(saved).toHaveBeenCalledTimes(1))
    expect(created).toHaveBeenCalledWith({})
    expect(saved.mock.calls[0]![0]).toEqual({ assignments: [{ participationId: 'part-p3', pairingIndex: 1, sidePosition: 1, drawnOrder: 1 }] })
    await vi.waitFor(() => expect(wrapper.findAll('[data-cy="round-draw-rest-item"]')).toHaveLength(15))
    await vi.waitFor(() => expect(body().textContent).toContain('Brouillon enregistré'))
    wrapper.findComponent(RoundDrawEntry).vm.$emit('place', 1, 'part-p5')
    await vi.waitFor(() => expect(saved).toHaveBeenCalledTimes(2))
    expect(created).toHaveBeenCalledTimes(1)
    expect(saved.mock.calls[1]![0].assignments).toHaveLength(2)
  })

  it('un brouillon rouvre la saisie avec ses affiches : « Changer » vide une affiche et renvoie la saisie', async () => {
    drafts = [draftOf([['p1', 1, 1, 1], ['p2', 1, 2, 2]], { roundKind: ROUND_KIND.ROUND_OF_16 })]
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-change-1"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="round-draw-pairing-1"]').text()).toContain('Joueur 01')
    expect(wrapper.get('[data-cy="round-draw-count"]').text()).toBe('1 / 8 affiches · 14 joueurs restants')
    await wrapper.get('[data-cy="round-draw-change-1"]').trigger('click')
    await vi.waitFor(() => expect(saved).toHaveBeenCalledTimes(1))
    expect(saved.mock.calls[0]![0]).toEqual({ assignments: [] })
  })

  it('tirage complet : validation active, confirmation définitive, puis le tour est créé (POST de validation)', async () => {
    current = preview(4)
    drafts = [draftOf([['p1', 1, 1, 1], ['p2', 1, 2, 2], ['p3', 2, 1, 3], ['p4', 2, 2, 4]], { roundKind: ROUND_KIND.SEMI })]
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-validate-open"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="round-draw-validate-open"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-cy="round-draw-validate-why"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="round-draw-recap-table"]').text()).toContain('Joueur 03')
    await wrapper.get('[data-cy="round-draw-validate-open"]').trigger('click')
    await vi.waitFor(() => expect(body().querySelector('[data-cy="round-draw-validate-dialog"]')).not.toBeNull())
    expect(body().querySelector('[data-cy="round-draw-validate-dialog"]')!.textContent).toContain('2 matchs seront créés, à 10 points')
    expect(body().querySelector('[data-cy="round-draw-validate-dialog"]')!.textContent).toContain('il n’est pas possible de revenir en arrière')
    body().querySelector<HTMLButtonElement>('[data-cy="round-draw-validate-confirm"]')!.click()
    await vi.waitFor(() => expect(validated).toHaveBeenCalledTimes(1))
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-state-drawn"]').exists()).toBe(true))
  })

  it('refus 409 « tirage déjà validé » : message d’erreur et « Recharger », la saisie est conservée', async () => {
    current = preview(4)
    drafts = [draftOf([['p1', 1, 1, 1], ['p2', 1, 2, 2], ['p3', 2, 1, 3], ['p4', 2, 2, 4]], { roundKind: ROUND_KIND.SEMI })]
    validationFailure = API_ERROR_CODE.DRAW_ALREADY_VALIDATED
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-validate-open"]').exists()).toBe(true))
    await wrapper.get('[data-cy="round-draw-validate-open"]').trigger('click')
    await vi.waitFor(() => expect(body().querySelector('[data-cy="round-draw-validate-confirm"]')).not.toBeNull())
    body().querySelector<HTMLButtonElement>('[data-cy="round-draw-validate-confirm"]')!.click()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-failure"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="round-draw-failure"]').text()).toContain('Le tirage de ce tour est validé')
    expect(wrapper.find('[data-cy="round-draw-reload"]').exists()).toBe(true)
    expect(wrapper.get('[data-cy="round-draw-pairing-1"]').text()).toContain('Joueur 01')
  })
})

describe('tour à choisir et « Changer de tour » (673e5b4b)', () => {
  beforeEach(() => {
    current = preview(12)
  })

  it('vivier hors 2, 4, 8, 16 : groupe radio limité aux tours autorisés, « Commencer le tirage » crée le brouillon avec le tour choisi', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-choice"]').exists()).toBe(true))
    const choice = wrapper.get('[data-cy="round-draw-choice"]')
    expect(choice.text()).toContain('Quel tour tirez-vous avec ces 12 joueurs ? (6 affiches)')
    expect(choice.get('fieldset legend').exists()).toBe(true)
    expect(choice.text()).toContain('Quarts')
    expect(choice.text()).toContain('Demi-finales')
    expect(choice.text()).not.toContain('Finale')
    expect(wrapper.get('[data-cy="round-draw-start"]').text()).toBe('Commencer le tirage des quarts')
    await wrapper.get('[data-cy="round-draw-start"]').trigger('click')
    await vi.waitFor(() => expect(created).toHaveBeenCalledWith({ roundKind: ROUND_KIND.QUARTER }))
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-entry"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="round-draw-round"]').text()).toContain('Tour : Quarts · 12 joueurs · 6 affiches')
  })

  it('« Changer de tour » annonce le nombre réel d’affiches perdues et remplace le brouillon par un nouveau POST', async () => {
    drafts = [draftOf([['p1', 1, 1, 1], ['p2', 1, 2, 2], ['p3', 2, 1, 3], ['p4', 2, 2, 4], ['p5', 3, 1, 5], ['p6', 3, 2, 6]], { roundKind: ROUND_KIND.QUARTER })]
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-change-round"]').exists()).toBe(true))
    await wrapper.get('[data-cy="round-draw-change-round"]').trigger('click')
    await vi.waitFor(() => expect(body().querySelector('[data-cy="round-draw-change-dialog"]')).not.toBeNull())
    const dialog = body().querySelector('[data-cy="round-draw-change-dialog"]')!
    expect(dialog.textContent).toContain('Les 3 affiches déjà enregistrées seront perdues.')
    expect(dialog.textContent).toContain('Demi-finales')
    body().querySelector<HTMLButtonElement>('[data-cy="round-draw-change-confirm"]')!.click()
    await vi.waitFor(() => expect(created).toHaveBeenCalledWith({ roundKind: ROUND_KIND.SEMI }))
  })
})

describe('barrages (RG14, PLAYOFF-DRAW)', () => {
  it('les premiers de poule n’entrent pas dans la liste « À placer » ; leur ligne du vivier dit qu’ils attendent', async () => {
    leaders = ['part-p1', 'part-p2']
    current = preview(8, { roundKind: ROUND_KIND.PLAYOFF, allowedRoundKinds: [ROUND_KIND.PLAYOFF] })
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="round-draw-entry"]').exists()).toBe(true))
    expect(wrapper.findAll('[data-cy="round-draw-rest-item"]')).toHaveLength(6)
    expect(wrapper.get('[data-cy="round-draw-pool"]').text()).toContain('Premiers de poule (en attente)')
    expect(wrapper.find('[data-cy="round-draw-playoff-wait"]').exists()).toBe(true)
    expect(wrapper.get('[data-cy="round-draw-count"]').text()).toBe('0 / 3 affiches · 6 joueurs restants')
  })
})
