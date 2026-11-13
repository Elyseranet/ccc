import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { useAdminEditionStore } from '../../../src/composables/useAdminEditionStore'
import { ROUTES } from '../../../src/consts/routes.const'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../../src/enums/round.enum'
import type { IEditionSummary } from '../../../src/interfaces/edition.interface'
import type { IMatch } from '../../../src/interfaces/match.interface'
import ClosingPage from '../../../src/pages/admin/phase-finale/cloture.vue'

const edition = (status: EDITION_STATUS): IEditionSummary => ({
  id: 'e1', code: '2026', year: 2026, name: null, heldOn: null, location: null, status, origin: EDITION_ORIGIN.APP,
  participantCount: 4, unidentifiedParticipantCount: null, matchCount: 3, scoredMatchCount: 3, unknownResultMatchCount: 0, champion: null, final: null, semiFinalists: []
} as IEditionSummary)

const participantIds = ['p1', 'p2', 'p3', 'p4']
const finalMatch = (winner: string | null): IMatch => ({
  id: 'final', sequence: 9, roundKind: ROUND_KIND.FINAL, poolRank: null, purpose: MATCH_PURPOSE.REGULAR, targetScore: 10,
  status: winner === null ? MATCH_STATUS.SCHEDULED : MATCH_STATUS.VALIDATED,
  sides: [
    { participationId: 'p1', competitorId: 'c1', displayName: 'Lou Bernard', score: winner === 'p1' ? 10 : null },
    { participationId: 'p2', competitorId: 'c2', displayName: 'Inès Perrin', score: winner === null ? null : 6 }
  ],
  winnerParticipationId: winner
})
const semiMatch = (): IMatch => ({
  id: 'semi', sequence: 8, roundKind: ROUND_KIND.SEMI, poolRank: null, purpose: MATCH_PURPOSE.REGULAR, targetScore: 10, status: MATCH_STATUS.VALIDATED,
  sides: [
    { participationId: 'p1', competitorId: 'c1', displayName: 'Lou Bernard', score: 10 },
    { participationId: 'p3', competitorId: 'c3', displayName: 'Mila Simon', score: 4 }
  ],
  winnerParticipationId: 'p1'
})

let status = EDITION_STATUS.PLAYOFFS
let winner: string | null = 'p1'
let closeFailure: API_ERROR_CODE | null = null
const closed = vi.fn()
const detail = () => ({
  ...edition(status), participants: participantIds.map(participationId => ({ participationId })), pools: [], draws: [], bracket: [],
  rounds: [
    { id: 'r-semi', kind: ROUND_KIND.SEMI, sequence: 1, status: ROUND_STATUS.COMPLETED, matchCount: 1, validatedMatchCount: 1 },
    { id: 'r-final', kind: ROUND_KIND.FINAL, sequence: 2, status: winner === null ? ROUND_STATUS.DRAWN : ROUND_STATUS.COMPLETED, matchCount: 1, validatedMatchCount: winner === null ? 0 : 1 }
  ],
  matches: [semiMatch(), finalMatch(winner)]
})

registerEndpoint('/api/v1/editions', defineEventHandler(() => [edition(status)]))
registerEndpoint('/api/v1/editions/e1', defineEventHandler(() => detail()))
registerEndpoint('/api/v1/editions/e1/cloture', { method: 'POST', handler: defineEventHandler((event) => {
  closed()
  if (closeFailure) {
    setResponseStatus(event, 409)
    return { statusCode: 409, code: closeFailure, message: 'x' }
  }
  status = EDITION_STATUS.CLOSED
  return detail()
}) })

const withRouterLink = { global: { components: { RouterLink } } }
const mounted: Array<{ unmount: () => void }> = []
const mountPage = async () => {
  const wrapper = await mountSuspended(ClosingPage, { route: ROUTES.ADMIN_FINAL_PHASE_CLOSING, attachTo: document.body, ...withRouterLink })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

beforeEach(() => {
  status = EDITION_STATUS.PLAYOFFS
  winner = 'p1'
  closeFailure = null
  closed.mockClear()
  document.body.innerHTML = ''
  clearNuxtData()
  useAdminEditionStore(useNuxtApp().$pinia).editionId = 'e1'
})

describe('page « Clôture » (F-26)', () => {
  it('finale validée : un h1, le stepper sur Clôture, champion·ne, finaliste, participants et aperçu des points (base × N / 50)', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="closing-prerequisites"]').exists()).toBe(true))
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Clôture')
    expect(wrapper.get('[data-cy="phase-steps"] [aria-current="step"]').text()).toContain('Clôture')
    const facts = wrapper.get('[data-cy="closing-facts"]').text()
    expect(facts).toContain('Lou Bernard')
    expect(facts).toContain('Inès Perrin')
    expect(facts).toContain('4')
    const preview = wrapper.get('[data-cy="closing-preview"]').text()
    expect(preview).toContain('Aperçu des points pour 4 participants')
    expect(preview).toContain('Champion·ne')
    expect(preview).toContain('18 × 4 / 50 = 1,44')
    expect(wrapper.find('[data-cy="closing-state-blocked"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="closing-open"]').attributes('disabled')).toBeUndefined()
  })

  it('finale non validée : message avec le lien vers les scores filtrés sur la finale (?tour=FINAL), bouton inactif avec sa raison, pas d’aperçu', async () => {
    winner = null
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="closing-state-blocked"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="closing-state-blocked-link"]').attributes('href')).toBe('/admin/matchs?tour=FINAL')
    expect(wrapper.get('[data-cy="closing-open"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-cy="closing-why"]').text()).toContain('la finale doit d’abord être validée')
    expect(wrapper.find('[data-cy="closing-preview"]').exists()).toBe(false)
  })

  it('édition déjà clôturée : l’alerte « Édition clôturée » avec le lien vers le palmarès, et aucun bouton de clôture', async () => {
    status = EDITION_STATUS.CLOSED
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="closing-state-closed"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="closing-state-closed-link"]').attributes('href')).toBe('/palmares')
    expect(wrapper.find('[data-cy="closing-open"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="closing-section"]').exists()).toBe(false)
  })

  it('la confirmation demande le code de l’édition : « Clôturer définitivement » reste inactif tant qu’il n’est pas saisi, puis une écriture et le message de succès', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="closing-open"]').exists()).toBe(true))
    await wrapper.get('[data-cy="closing-open"]').trigger('click')
    await vi.waitFor(() => expect(document.body.querySelector('[data-cy="closing-dialog"]')).not.toBeNull())
    const confirm = () => document.body.querySelector('[data-cy="closing-confirm"]') as HTMLButtonElement
    expect(document.body.querySelector('[data-cy="closing-dialog"]')!.textContent).toContain('Clôturer l’édition 2026 ?')
    expect(document.body.querySelector('[data-cy="closing-dialog"]')!.textContent).toContain('2026')
    expect(confirm().disabled).toBe(true)
    const input = document.body.querySelector('[data-cy="closing-code"] input') as HTMLInputElement
    input.value = '2025'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.waitFor(() => expect(confirm().disabled).toBe(true))
    input.value = '2026'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.waitFor(() => expect(confirm().disabled).toBe(false))
    confirm().click()
    await vi.waitFor(() => expect(closed).toHaveBeenCalledTimes(1))
    await vi.waitFor(() => expect(wrapper.find('[data-cy="closing-state-success"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="closing-state-success"]').text()).toContain('Édition 2026 clôturée.')
    expect(wrapper.find('[data-cy="closing-open"]').exists()).toBe(false)
  })

  it('409 « finale non validée » : message d’erreur avec « Vérifier l’état », qui relit l’édition', async () => {
    closeFailure = API_ERROR_CODE.FINAL_NOT_VALIDATED
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="closing-open"]').exists()).toBe(true))
    await wrapper.get('[data-cy="closing-open"]').trigger('click')
    await vi.waitFor(() => expect(document.body.querySelector('[data-cy="closing-code"] input')).not.toBeNull())
    const input = document.body.querySelector('[data-cy="closing-code"] input') as HTMLInputElement
    input.value = '2026'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.waitFor(() => expect((document.body.querySelector('[data-cy="closing-confirm"]') as HTMLButtonElement).disabled).toBe(false))
    ;(document.body.querySelector('[data-cy="closing-confirm"]') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="closing-failure"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="closing-failure"]').text()).toContain('La finale n’est pas validée.')
    winner = null
    await wrapper.get('[data-cy="closing-verify"]').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[data-cy="closing-state-blocked"]').exists()).toBe(true))
    expect(wrapper.find('[data-cy="closing-failure"]').exists()).toBe(false)
  })
})
