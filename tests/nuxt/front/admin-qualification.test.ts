import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineEventHandler, getQuery, readBody, setResponseStatus } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { useAdminEditionStore } from '../../../src/composables/useAdminEditionStore'
import { ROUTES } from '../../../src/consts/routes.const'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_STATUS } from '../../../src/enums/match.enum'
import type { IEditionSummary } from '../../../src/interfaces/edition.interface'
import type { IQualificationStatus } from '../../../src/interfaces/qualification.interface'
import QualificationPage from '../../../src/pages/admin/phase-finale/qualification.vue'
import { TIEBREAK_FORMAT } from '../../../src/enums/domain.enum'
import { boundaryTie, buildQualificationStatus,member, pairTie, qualifiedEntry, tiebreakMatch } from '../../helpers/qualification'

const edition = (status: EDITION_STATUS): IEditionSummary => ({
  id: 'e1', code: '2026', year: 2026, name: null, heldOn: null, location: null, status, origin: EDITION_ORIGIN.APP,
  participantCount: null, unidentifiedParticipantCount: null, matchCount: 3, scoredMatchCount: 1, unknownResultMatchCount: 0, champion: null, final: null, semiFinalists: []
} as IEditionSummary)

let editions: IEditionSummary[] = [edition(EDITION_STATUS.POOLS_PLAYING)]
let current: IQualificationStatus = buildQualificationStatus()
let finalizeFailure: { statusCode: number, code: API_ERROR_CODE } | null = null
const reads = vi.fn()
const finalizations = vi.fn()
const tiebreaks = vi.fn()

registerEndpoint('/api/v1/editions', defineEventHandler(() => editions))
registerEndpoint('/api/v1/admin/editions/e1/qualification', defineEventHandler((event) => {
  reads(getQuery(event))
  return current
}))
registerEndpoint('/api/v1/editions/e1/qualification', { method: 'POST', handler: defineEventHandler(async (event) => {
  finalizations(await readBody(event))
  if (finalizeFailure) {
    setResponseStatus(event, finalizeFailure.statusCode)
    return { statusCode: finalizeFailure.statusCode, code: finalizeFailure.code, message: 'x' }
  }
  current = buildQualificationStatus({ listFinalized: true, parameters: { topPerPool: 2, bestNextCount: 0, withPlayoff: false }, qualified: [] })
  return { parameters: current.parameters, editionStatus: EDITION_STATUS.QUALIFIED, qualified: [], eliminatedCount: 0, replayed: false }
}) })
registerEndpoint('/api/v1/editions/e1/departages', { method: 'POST', handler: defineEventHandler(async (event) => {
  tiebreaks(await readBody(event))
  setResponseStatus(event, 201)
  return tiebreakMatch(MATCH_STATUS.SCHEDULED, ['b', 'c'])
}) })

const withRouterLink = { global: { components: { RouterLink } } }
const mounted: Array<{ unmount: () => void }> = []
const mountPage = async () => {
  const wrapper = await mountSuspended(QualificationPage, { route: ROUTES.ADMIN_FINAL_PHASE_QUALIFICATION, attachTo: document.body, ...withRouterLink })
  mounted.push(wrapper)
  return wrapper
}
const body = () => document.body
const load = async () => {
  const wrapper = await mountPage()
  await vi.waitFor(() => expect(wrapper.find('[data-cy="qualification-parameters"]').exists()).toBe(true))
  return wrapper
}
const type = async (cy: string, value: string) => {
  const input = body().querySelector<HTMLInputElement>(`[data-cy="${cy}"] input`)!
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

beforeEach(() => {
  editions = [edition(EDITION_STATUS.POOLS_PLAYING)]
  current = buildQualificationStatus()
  finalizeFailure = null
  reads.mockClear()
  finalizations.mockClear()
  tiebreaks.mockClear()
  document.body.innerHTML = ''
  clearNuxtData()
  useAdminEditionStore(useNuxtApp().$pinia).editionId = 'e1'
})

describe('texte d’une égalité entre poules selon le nombre de joueurs (RG20, A11, R-1)', () => {
  it('2 joueurs : match 1 contre 1 à 5, sans mini-poule', async () => {
    current = buildQualificationStatus({ ties: [{ ...boundaryTie(), format: TIEBREAK_FORMAT.ONE_VS_ONE, slots: 1, members: [member('d', 'Lisa Masson'), member('e', 'Paul Girard')] }] })
    const wrapper = await load()
    const card = wrapper.get('[data-cy="qualification-tie-0"]').text()
    expect(card).toContain('Meilleur 3e entre poules · 2 joueurs')
    expect(card).toContain('Match 1 contre 1, cible 5 points.')
    expect(card).not.toContain('Mini-poule')
    expect(card).not.toContain('côtés')
  })

  it('3 joueurs ou plus : un seul match à N côtés, premier à 3, sans mini-poule', async () => {
    current = buildQualificationStatus({ ties: [boundaryTie()] })
    const wrapper = await load()
    const card = wrapper.get('[data-cy="qualification-tie-0"]').text()
    expect(card).toContain('Un seul match à 3 côtés, premier à 3 points.')
    expect(card).not.toContain('Mini-poule')
    expect(card).not.toContain('1 contre 1')
  })

  it('égalité de poule à 3 joueurs ou plus : la mini-poule (R-6) précède le match à N côtés', async () => {
    current = buildQualificationStatus({ ties: [{ ...pairTie(), format: TIEBREAK_FORMAT.MULTI_SIDES, members: [member('a', 'A'), member('b', 'B'), member('c', 'C')] }] })
    const wrapper = await load()
    expect(wrapper.get('[data-cy="qualification-tie-0"]').text()).toContain('Mini-poule d’abord')
  })
})

describe('page « Qualification » (F-24)', () => {
  it('rend un h1 unique, la navigation de la phase finale (Tirage de tour et Clôture cliquables), les quatre étapes et le classement', async () => {
    const wrapper = await load()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Qualification')
    const phase = wrapper.get('[data-cy="phase-steps"]')
    expect(phase.text()).toContain('Tirage de tour')
    expect(phase.text()).toContain('Clôture')
    expect(phase.findAll('button')).toHaveLength(2)
    expect(phase.find('[aria-current="step"]').text()).toContain('Qualification')
    expect(wrapper.text()).toContain('Poules validées')
    expect(wrapper.get('[data-cy="qualification-ranking"]').text()).toContain('Maya Legrand')
    expect(wrapper.get('[data-cy="qualification-prerequisites-count"]').text()).toBe('12 / 12')
  })

  it('sans égalité ni match en attente : message dédié, arrêt de la liste possible, aperçu « n × poules + m »', async () => {
    const wrapper = await load()
    expect(wrapper.get('[data-cy="qualification-no-ties"]').text()).toContain('Aucune égalité à départager')
    expect(wrapper.get('[data-cy="qualification-preview"]').text()).toContain('Aperçu : 4 qualifiés')
    expect(wrapper.get('[data-cy="qualification-preview"]').text()).toContain('(2 × 2 poules + 0)')
    expect(body().querySelector('[data-cy="qualification-finalize-open"]')!.hasAttribute('disabled')).toBe(false)
    expect(body().querySelector('[data-cy="qualification-finalize-why"]')).toBeNull()
  })

  it('des matchs de poule à valider : les actions sont inactives et la raison est écrite sous chaque bouton', async () => {
    current = buildQualificationStatus({ pendingMatchCount: 3, ties: [pairTie(), boundaryTie()] })
    const wrapper = await load()
    expect(wrapper.get('[data-cy="qualification-ties-count"]').text()).toBe('2 égalités restantes pour une place qualificative')
    expect(wrapper.get('[data-cy="qualification-create-tiebreak-0"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-cy="qualification-tie-why-0"]').text()).toBe('Indisponible : 3 matchs de poule à valider.')
    expect(wrapper.get('[data-cy="qualification-finalize-why"]').text()).toBe('Indisponible : 2 égalités restantes et 3 matchs de poule à valider.')
    expect(wrapper.get('[data-cy="qualification-matches-link"]').text()).toContain('Voir les 3 matchs restants')
  })

  it('crée le départage d’une égalité entre poules avec la configuration (n et m) et recharge l’état', async () => {
    current = buildQualificationStatus({ ties: [boundaryTie()] })
    const wrapper = await load()
    expect(wrapper.get('[data-cy="qualification-tie-0"]').text()).toContain('Meilleur 3e entre poules · 3 joueurs')
    expect(wrapper.get('[data-cy="qualification-tie-0"]').text()).toContain('Places restantes : 2.')
    await wrapper.get('[data-cy="qualification-create-tiebreak-0"]').trigger('click')
    await vi.waitFor(() => expect(tiebreaks).toHaveBeenCalledTimes(1))
    expect(tiebreaks.mock.calls[0]![0]).toEqual({ participationIds: ['part-d', 'part-e', 'part-f'], parameters: { topPerPool: 2, bestNextCount: 0 } })
    await vi.waitFor(() => expect(reads.mock.calls.length).toBeGreaterThan(1))
  })

  it('un départage créé et non joué : bouton inactif, lien vers « Poules et matchs » filtré sur les départages, aucune saisie ici', async () => {
    current = buildQualificationStatus({ ties: [pairTie()], pendingMatchCount: 1, tiebreakMatches: [tiebreakMatch(MATCH_STATUS.SCHEDULED, ['b', 'c'])] })
    const wrapper = await load()
    expect(wrapper.get('[data-cy="qualification-tie-0"]').text()).toContain('Départage créé, à jouer')
    expect(wrapper.get('[data-cy="qualification-tie-why-0"]').text()).toContain('saisissez son score')
    expect(wrapper.get('[data-cy="qualification-tie-score-link-0"]').attributes('href')).toBe('/admin/matchs?departages=1')
    expect(wrapper.find('[data-cy^="admin-score-"]').exists()).toBe(false)
  })

  it('« Arrêter la liste… » ouvre la confirmation (définitif ; le focus sur Annuler se vérifie en e2e), puis écrit les paramètres et confirme', async () => {
    const wrapper = await load()
    await wrapper.get('[data-cy="qualification-finalize-open"]').trigger('click')
    await vi.waitFor(() => expect(body().querySelector('[data-cy="qualification-finalize-dialog"]')).not.toBeNull())
    const dialog = body().querySelector('[data-cy="qualification-finalize-dialog"]')!
    expect(dialog.textContent).toContain('il n’est pas possible de revenir en arrière')
    body().querySelector<HTMLButtonElement>('[data-cy="qualification-finalize-confirm"]')!.click()
    await vi.waitFor(() => expect(finalizations).toHaveBeenCalledTimes(1))
    expect(finalizations.mock.calls[0]![0]).toEqual({ topPerPool: 2, bestNextCount: 0, withPlayoff: false })
    await vi.waitFor(() => expect(wrapper.find('[data-cy="qualification-finalized"]').exists()).toBe(true))
  })

  it('un paramètre hors bornes est refusé par écrit, sans correction silencieuse : plus d’envoi, arrêt de la liste inactif', async () => {
    const wrapper = await load()
    await type('qualification-top-per-pool', '9')
    await vi.waitFor(() => expect(body().textContent).toContain('Valeur trop haute : maximum 4.'))
    expect(wrapper.find('[data-cy="qualification-preview"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="qualification-finalize-why"]').text()).toContain('corrigez les paramètres')
    const readsBefore = reads.mock.calls.length
    await new Promise(resolve => setTimeout(resolve, 600))
    expect(reads.mock.calls.length).toBe(readsBefore)
  })

  it('un paramètre valide relance la simulation avec ?topPerPool=&bestNextCount=, après une pause', async () => {
    await load()
    await type('qualification-best-next', '1')
    await vi.waitFor(() => expect(reads.mock.calls.some(([query]) => query.topPerPool === '2' && query.bestNextCount === '1')).toBe(true), { timeout: 4000 })
  })

  it('liste arrêtée : message « Liste arrêtée », champs en lecture seule, aucune égalité ni bouton d’arrêt, aperçu des qualifiés conservé', async () => {
    current = buildQualificationStatus({
      listFinalized: true,
      parameters: { topPerPool: 1, bestNextCount: 0, withPlayoff: true },
      qualified: [qualifiedEntry('a', 'Maya Legrand', 'pool-1', 1), qualifiedEntry('h', 'Clara Lambert', 'pool-2', 1)]
    })
    const wrapper = await load()
    expect(wrapper.get('[data-cy="qualification-finalized"]').text()).toContain('avec barrages')
    expect(wrapper.find('[data-cy="qualification-ties"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="qualification-finalize-open"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="qualification-top-per-pool"] input').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-cy="qualification-qualified"]').text()).toContain('Clara Lambert')
  })

  it('édition clôturée : message dédié et arrêt de la liste inactif avec sa raison', async () => {
    editions = [edition(EDITION_STATUS.CLOSED)]
    const wrapper = await load()
    expect(wrapper.get('[data-cy="qualification-closed"]').text()).toContain('Édition clôturée')
  })

  it('409 à l’arrêt de la liste : message d’erreur et bouton « Recharger », la confirmation se ferme', async () => {
    finalizeFailure = { statusCode: 409, code: API_ERROR_CODE.QUALIFICATION_NOT_READY }
    const wrapper = await load()
    await wrapper.get('[data-cy="qualification-finalize-open"]').trigger('click')
    await vi.waitFor(() => expect(body().querySelector('[data-cy="qualification-finalize-confirm"]')).not.toBeNull())
    body().querySelector<HTMLButtonElement>('[data-cy="qualification-finalize-confirm"]')!.click()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="qualification-failure"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="qualification-failure"]').text()).toContain('La liste ne peut pas être arrêtée.')
    expect(wrapper.find('[data-cy="qualification-reload"]').exists()).toBe(true)
  })

  it('aucune poule tirée : état vide explicite', async () => {
    current = buildQualificationStatus({ pools: [] })
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Aucune poule à qualifier'))
  })
})
