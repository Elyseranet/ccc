import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineEventHandler, getHeader, getQuery, readBody, setResponseStatus } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { useAdminEditionStore } from '../../../src/composables/useAdminEditionStore'
import { ROUTES } from '../../../src/consts/routes.const'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import { ROUND_KIND } from '../../../src/enums/round.enum'
import type { IAdminMatch } from '../../../src/interfaces/admin-match.interface'
import type { IEditionSummary } from '../../../src/interfaces/edition.interface'
import AdminMatchesPage from '../../../src/pages/admin/matchs.vue'
import { buildAdminMatch } from '../../helpers/admin-match'

const edition = (status: EDITION_STATUS): IEditionSummary => ({
  id: 'e1', code: '2026', year: 2026, name: null, heldOn: null, location: null, status, origin: EDITION_ORIGIN.APP,
  participantCount: null, unidentifiedParticipantCount: null, matchCount: 3, scoredMatchCount: 1, unknownResultMatchCount: 0, champion: null, final: null, semiFinalists: []
} as IEditionSummary)

let editions: IEditionSummary[] = [edition(EDITION_STATUS.POOLS_PLAYING)]
let matches: IAdminMatch[] = []
let listFailing = false
const listQueries = vi.fn()
const validations = vi.fn()

registerEndpoint('/api/v1/editions', defineEventHandler(() => editions))
registerEndpoint('/api/v1/admin/editions/e1/matchs', defineEventHandler((event) => {
  listQueries(getQuery(event))
  if (listFailing) {
    setResponseStatus(event, 500)
    return { statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'x' }
  }
  return matches
}))
registerEndpoint('/api/v1/matchs/m2/validation', { method: 'POST', handler: defineEventHandler((event) => {
  validations(getHeader(event, 'if-match'))
  return { match: buildAdminMatch({ id: 'm2', sequence: 2, status: MATCH_STATUS.VALIDATED, version: 8 }), pool: null, round: {}, advancingParticipationIds: [] }
}) })

const recordings = vi.fn()
registerEndpoint('/api/v1/matchs/m3/score', { method: 'PUT', handler: defineEventHandler(async (event) => {
  recordings(getHeader(event, 'if-match'), await readBody(event))
  return buildAdminMatch({ id: 'm3', sequence: 3, status: MATCH_STATUS.RECORDED, version: 3 })
}) })
registerEndpoint('/api/v1/matchs/m3/validation', { method: 'POST', handler: defineEventHandler((event) => {
  validations(getHeader(event, 'if-match'))
  return { match: buildAdminMatch({ id: 'm3', sequence: 3, status: MATCH_STATUS.VALIDATED, version: 4 }), pool: null, round: {}, advancingParticipationIds: [] }
}) })

registerEndpoint('/api/v1/matchs/m4/score', { method: 'PUT', handler: defineEventHandler(async (event) => {
  recordings(getHeader(event, 'if-match'), await readBody(event))
  return buildAdminMatch({ id: 'm4', sequence: 4, status: MATCH_STATUS.RECORDED, version: 5 })
}) })
registerEndpoint('/api/v1/matchs/m4/validation', { method: 'POST', handler: defineEventHandler((event) => {
  validations(getHeader(event, 'if-match'))
  return { match: buildAdminMatch({ id: 'm4', sequence: 4, status: MATCH_STATUS.VALIDATED, version: 6 }), pool: null, round: {}, advancingParticipationIds: [] }
}) })

const withRouterLink = { global: { components: { RouterLink } } }
const mountPage = () => mountSuspended(AdminMatchesPage, { route: ROUTES.ADMIN_MATCHES, attachTo: document.body, ...withRouterLink })
const body = () => document.body

beforeEach(async () => {
  editions = [edition(EDITION_STATUS.POOLS_PLAYING)]
  matches = [
    buildAdminMatch({ id: 'm1', sequence: 1, status: MATCH_STATUS.VALIDATED, version: 6 }),
    buildAdminMatch({ id: 'm2', sequence: 2, status: MATCH_STATUS.RECORDED, version: 7 }),
    buildAdminMatch({ id: 'm3', sequence: 3, status: MATCH_STATUS.SCHEDULED, version: 2 })
  ]
  listFailing = false
  validations.mockClear()
  recordings.mockClear()
  document.body.innerHTML = ''
  clearNuxtData()
  useAdminEditionStore(useNuxtApp().$pinia).editionId = 'e1'
})

describe('page « Poules et matchs » (F-08)', () => {
  it('rend un h1 unique, quatre filtres avec leurs compteurs et la file « À traiter » par défaut', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-matches-queue"]').exists()).toBe(true))
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Poules et matchs')
    const filters = wrapper.get('[data-cy="admin-matches-filters"]')
    expect(filters.text()).toContain('À traiter')
    expect(wrapper.get('[data-cy="admin-matches-filter-a-traiter"]').text()).toContain('2')
    expect(wrapper.get('[data-cy="admin-matches-filter-saisis"]').text()).toContain('1')
    expect(wrapper.get('[data-cy="admin-matches-filter-sans-score"]').text()).toContain('1')
    expect(wrapper.get('[data-cy="admin-matches-filter-valides"]').text()).toContain('1')
    expect(wrapper.find('[data-cy="admin-match-m1"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="admin-match-m2"]').text()).toContain('Saisi · à valider')
    expect(wrapper.get('[data-cy="admin-match-m3"]').text()).toContain('Sans score')
  })

  it('la file charge tous les tours (aucun ?tour= envoyé à l’API)', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-matches-queue"]').exists()).toBe(true))
    expect(listQueries).toHaveBeenCalled()
    expect(listQueries.mock.calls[0]![0]).not.toHaveProperty('tour')
  })

  it('le tour par défaut est le tour en cours, le sélecteur de poule n’existe que pour « Poules »', async () => {
    matches = [
      buildAdminMatch({ id: 'p1', sequence: 1, status: MATCH_STATUS.VALIDATED, roundKind: ROUND_KIND.POOLS, poolRank: 1 }),
      buildAdminMatch({ id: 'q1', sequence: 2, status: MATCH_STATUS.SCHEDULED, roundKind: ROUND_KIND.QUARTER, poolRank: null, targetScore: 10 })
    ]
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-match-q1"]').exists()).toBe(true))
    expect(wrapper.find('[data-cy="admin-matches-pool"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="admin-matches-round"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="admin-match-p1"]').exists()).toBe(false)
  })

  it('les boutons portent le nom des deux joueurs et un libellé visible contenu dans leur nom', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-match-m2"]').exists()).toBe(true))
    const validate = wrapper.get('[data-cy="admin-match-validate-m2"]')
    expect(validate.text()).toBe('Valider')
    expect(validate.attributes('aria-label')).toBe('Valider Clara Lambert contre Paul Girard')
    expect(wrapper.get('[data-cy="admin-match-enter-m3"]').attributes('aria-label')).toBe('Saisir Clara Lambert contre Paul Girard')
  })

  it('le filtre « Validés » ne montre que les matchs validés, sans aucune action, et passe dans l’URL (?f=valides)', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-match-m2"]').exists()).toBe(true))
    await wrapper.get('[data-cy="admin-matches-filter-valides"]').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-match-m1"]').exists()).toBe(true))
    expect(useRoute().query.f).toBe('valides')
    expect(wrapper.find('[data-cy="admin-match-m2"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="admin-match-m1"]').text()).toContain('Validé')
    expect(wrapper.find('[data-cy="admin-match-validate-m1"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="admin-match-enter-m1"]').exists()).toBe(false)
  })

  it('une vue filtrée sans match affiche un vide dédié, pas la file', async () => {
    matches = [buildAdminMatch({ id: 'm1', status: MATCH_STATUS.VALIDATED })]
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-matches-view-empty"]').exists()).toBe(true))
    expect(wrapper.find('[data-cy="admin-matches-queue"]').exists()).toBe(false)
  })

  it('poules non tirées : état vide explicite', async () => {
    editions = [edition(EDITION_STATUS.REGISTRATION)]
    matches = []
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="async-state-empty"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="async-state-empty"]').text()).toContain('pas encore tirées')
  })

  it('erreur serveur : alerte avec nouvelle tentative, sans plantage', async () => {
    listFailing = true
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="async-state-error"]').exists()).toBe(true))
    expect(wrapper.find('[data-cy="async-state-retry"]').exists()).toBe(true)
  })

  it('édition archivée : lecture seule, aucune action sur les cartes', async () => {
    editions = [edition(EDITION_STATUS.CLOSED)]
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-matches-queue"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="admin-matches-readonly"]').text()).toContain('archivée')
    expect(wrapper.find('[data-cy="admin-match-validate-m2"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="admin-match-enter-m3"]').exists()).toBe(false)
  })
})

describe('validation depuis une carte (F-08)', () => {
  it('« Valider » ouvre la confirmation, focus sur « Annuler », puis valide avec If-Match et affiche la confirmation', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-match-validate-m2"]').exists()).toBe(true))
    await wrapper.get('[data-cy="admin-match-validate-m2"]').trigger('click')
    await vi.waitFor(() => expect(body().querySelector('[data-cy="admin-validate-text"]')).not.toBeNull())
    expect(body().querySelector('[data-cy="admin-validate-text"]')!.textContent).toContain('Clara Lambert 5 – 1 Paul Girard')
    const confirm = body().querySelector<HTMLButtonElement>('[data-cy="admin-validate-confirm"]')!
    confirm.click()
    confirm.click()
    await vi.waitFor(() => expect(validations).toHaveBeenCalled())
    await flushPromises()
    expect(validations).toHaveBeenCalledTimes(1)
    expect(validations).toHaveBeenCalledWith('"7"')
    await vi.waitFor(() => expect(body().textContent).toContain('Score validé, classement recalculé'))
  })
})

describe('saisie d’un score (F-08)', () => {
  const openEntry = async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-match-enter-m3"]').exists()).toBe(true))
    await wrapper.get('[data-cy="admin-match-enter-m3"]').trigger('click')
    await vi.waitFor(() => expect(body().querySelector('[data-cy="admin-score-form"]')).not.toBeNull())
    return wrapper
  }
  const type = async (index: number, value: string) => {
    const input = body().querySelector<HTMLInputElement>(`[data-cy="admin-score-input-${index}"] input`)!
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
  }

  it('deux champs numériques nommés par les joueurs, rappel de la cible 5', async () => {
    await openEntry()
    const inputs = [...body().querySelectorAll<HTMLInputElement>('[data-cy^="admin-score-input-"] input')]
    expect(inputs).toHaveLength(2)
    expect(inputs.map(input => input.getAttribute('inputmode'))).toEqual(['numeric', 'numeric'])
    expect(body().querySelector('[data-cy="admin-score-form"]')!.textContent).toContain('Clara Lambert')
    expect(body().querySelector('[data-cy="admin-score-form"]')!.textContent).toContain('Paul Girard')
    expect(body().querySelector('[data-cy="admin-score-rule"]')!.textContent).toContain('Cible 5')
  })

  it('un score qui n’atteint pas 5 est refusé avant envoi : message affiché, aucun appel', async () => {
    await openEntry()
    await type(0, '3')
    await type(1, '2')
    body().querySelector<HTMLButtonElement>('[data-cy="admin-score-validate"]')!.click()
    await flushPromises()
    expect(body().querySelector('[data-cy="admin-score-form-error"]')!.textContent).toContain('exactement 5')
    expect(recordings).not.toHaveBeenCalled()
    expect(validations).not.toHaveBeenCalled()
  })

  it('« Valider » sur un match sans score enregistre puis valide, avec la version lue puis celle de la réponse', async () => {
    await openEntry()
    await type(0, '5')
    await type(1, '1')
    body().querySelector<HTMLButtonElement>('[data-cy="admin-score-validate"]')!.click()
    await vi.waitFor(() => expect(validations).toHaveBeenCalledTimes(1))
    expect(recordings).toHaveBeenCalledTimes(1)
    expect(recordings.mock.calls[0]![0]).toBe('"2"')
    expect(recordings.mock.calls[0]![1]).toEqual({ scores: [{ participationId: 'p1', score: 5 }, { participationId: 'p2', score: 1 }] })
    expect(validations).toHaveBeenCalledWith('"3"')
  })

  it('« Enregistrer » n’appelle que la saisie', async () => {
    await openEntry()
    await type(0, '1')
    await type(1, '5')
    body().querySelector<HTMLButtonElement>('[data-cy="admin-score-save"]')!.click()
    await vi.waitFor(() => expect(recordings).toHaveBeenCalledTimes(1))
    await flushPromises()
    expect(validations).not.toHaveBeenCalled()
  })
})

describe('départage à 3 côtés ou plus (F-21)', () => {
  const sideOf = (index: number, name: string, recorded: number | null) => ({ participationId: `p${index}`, competitorId: `c${index}`, displayName: name, score: null, recordedScore: recorded })
  const tiebreak = (id: string, sequence: number, status: MATCH_STATUS, scores: Array<number | null>, names: string[]) => buildAdminMatch({
    id, sequence, status, purpose: MATCH_PURPOSE.TIEBREAK, poolRank: 5, targetScore: 3, version: 4,
    sides: names.map((name, index) => sideOf(index + 1, name, scores[index] ?? null))
  })
  const three = ['Hugo Roux', 'Emma Petit', 'Noé Garnier']

  beforeEach(() => {
    matches = [
      tiebreak('m4', 4, MATCH_STATUS.SCHEDULED, [null, null, null, null], [...three, 'Adam Morel']),
      tiebreak('m5', 5, MATCH_STATUS.RECORDED, [3, 1, 0], three),
      buildAdminMatch({ id: 'm3', sequence: 3, status: MATCH_STATUS.SCHEDULED, version: 2 })
    ]
  })

  const mountQueue = async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-match-m4"]').exists()).toBe(true))
    return wrapper
  }

  it('la carte liste les quatre côtés dans une liste native, « — » sans score, et le bouton nomme tous les joueurs', async () => {
    const wrapper = await mountQueue()
    const sides = wrapper.get('[data-cy="admin-match-sides-m4"]')
    expect(sides.element.tagName).toBe('UL')
    expect(sides.findAll('li').map(item => item.find('.match-queue__side-name').text())).toEqual([...three, 'Adam Morel'])
    expect(sides.text()).not.toContain('–')
    expect(sides.findAll('li').every(item => item.text().includes('Aucun score'))).toBe(true)
    expect(wrapper.get('[data-cy="admin-match-enter-m4"]').attributes('aria-label')).toBe('Saisir le départage Hugo Roux, Emma Petit, Noé Garnier et Adam Morel')
  })

  it('une carte à trois côtés saisis montre un score par ligne, sans « – », et propose « Valider »', async () => {
    const wrapper = await mountQueue()
    const sides = wrapper.get('[data-cy="admin-match-sides-m5"]')
    expect(sides.findAll('.match-queue__side-value').map(value => value.text())).toEqual(['3', '1', '0'])
    expect(sides.text()).not.toContain('–')
    expect(wrapper.get('[data-cy="admin-match-validate-m5"]').attributes('aria-label')).toBe('Valider le départage Hugo Roux, Emma Petit et Noé Garnier')
  })

  it('une carte à deux côtés garde le duel « A 5 – 1 B », sans liste', async () => {
    const wrapper = await mountQueue()
    expect(wrapper.find('[data-cy="admin-match-sides-m3"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="admin-match-m3"]').text()).toContain('Clara Lambert')
  })

  it('le formulaire a un champ par joueur, sans « – », la cible 3 et « Valider 3–1–0 » une fois les scores saisis', async () => {
    matches = [tiebreak('m4', 4, MATCH_STATUS.SCHEDULED, [null, null, null], three)]
    const page = await mountPage()
    await vi.waitFor(() => expect(page.find('[data-cy="admin-match-enter-m4"]').exists()).toBe(true))
    await page.get('[data-cy="admin-match-enter-m4"]').trigger('click')
    await vi.waitFor(() => expect(body().querySelector('[data-cy="admin-score-form"]')).not.toBeNull())
    const form = body().querySelector('[data-cy="admin-score-form"]')!
    expect(form.querySelectorAll('[data-cy^="admin-score-input-"] input')).toHaveLength(3)
    expect(form.querySelector('.score-entry-form__vs')).toBeNull()
    expect(form.querySelector('[data-cy="admin-score-rule"]')!.textContent).toContain('Cible 3')
    expect(form.querySelector('[data-cy="admin-score-rule"]')!.textContent).toContain('Départage à 3 joueurs')
    expect(form.querySelector('[data-cy="admin-score-validate"]')!.textContent).toBe('Valider')
    const type = async (index: number, value: string) => {
      const input = body().querySelector<HTMLInputElement>(`[data-cy="admin-score-input-${index}"] input`)!
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await flushPromises()
    }
    await type(0, '3')
    await type(1, '1')
    await type(2, '0')
    expect(form.querySelector('[data-cy="admin-score-validate"]')!.textContent).toBe('Valider 3–1–0')
    body().querySelector<HTMLButtonElement>('[data-cy="admin-score-validate"]')!.click()
    await vi.waitFor(() => expect(validations).toHaveBeenCalledTimes(1))
    expect(recordings.mock.calls[0]![1]).toEqual({ scores: [{ participationId: 'p1', score: 3 }, { participationId: 'p2', score: 1 }, { participationId: 'p3', score: 0 }] })
  })

  it('la confirmation de validation rappelle les trois noms et leur score', async () => {
    const wrapper = await mountQueue()
    await wrapper.get('[data-cy="admin-match-validate-m5"]').trigger('click')
    await vi.waitFor(() => expect(body().querySelector('[data-cy="admin-validate-text"]')).not.toBeNull())
    expect(body().querySelector('[data-cy="admin-validate-text"]')!.textContent).toContain('Hugo Roux 3, Emma Petit 1, Noé Garnier 0')
  })
})
