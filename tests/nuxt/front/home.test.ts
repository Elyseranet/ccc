import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import HomeBento from '../../../src/components/home/HomeBento.vue'
import HomeCurrentEdition from '../../../src/components/home/HomeCurrentEdition.vue'
import { HOME_MATCHES_QUERY } from '../../../src/consts/home.const'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../../src/enums/round.enum'
import type { IEditionDetail, IEditionSummary } from '../../../src/interfaces/edition.interface'
import type { IHomeOverview } from '../../../src/interfaces/home.interface'
import type { IMatch } from '../../../src/interfaces/match.interface'
import { buildHomeOverview, selectChampion, selectCurrentEdition, toLatestScore } from '../../../src/utils/home.util'
import HomePage from '../../../src/pages/index.vue'

const withRouterLink = { global: { components: { RouterLink } } }

const person = (id: string, name: string) => ({ id, displayName: name, firstName: null, lastName: null, nickname: null, avatarUrl: null })
const edition = (code: string, year: number, status: EDITION_STATUS, champion: IEditionSummary['champion'] = null): IEditionSummary => ({
  id: `id-${code}`, code, year, name: null, heldOn: null, location: null, status, origin: EDITION_ORIGIN.LEGACY_IMPORT,
  participantCount: 45, unidentifiedParticipantCount: 0, matchCount: 105, scoredMatchCount: 68, unknownResultMatchCount: 0, champion, final: null
})
const closed2025 = edition('2025', 2025, EDITION_STATUS.CLOSED, { competitor: person('c1', 'Lou Bernard'), titlesToDate: 4 })
const closed2024 = edition('2024', 2024, EDITION_STATUS.CLOSED, { competitor: person('c2', 'Nina Perrin'), titlesToDate: 3 })
const current2026 = edition('2026', 2026, EDITION_STATUS.POOLS_PLAYING)
const stats = { editions: 16, competitors: 145, matches: 729, scoredMatches: 554, unknownResultMatches: 175 }
const ranking = [1, 2, 3, 4].map(rank => ({ rank, competitor: person(`r${rank}`, `Joueur ${rank}`), points: 50 - rank, participations: 5, average: 10, titles: rank }))

const sideOf = (participationId: string, competitorId: string, displayName: string, score: number | null) => ({ participationId, competitorId, displayName, score })
const match = (id: string, status: MATCH_STATUS, scores: [number | null, number | null], poolRank: number | null = 4): IMatch => ({
  id, sequence: 1, roundKind: ROUND_KIND.POOLS, poolRank, purpose: MATCH_PURPOSE.REGULAR, targetScore: 5, status,
  sides: [sideOf('pa', 'ca', 'Manon Faure', scores[0]), sideOf('pb', 'cb', 'Théo Gauthier', scores[1])],
  winnerParticipationId: scores[0] !== null && scores[1] !== null ? (scores[0] > scores[1] ? 'pa' : 'pb') : null
})
const detail: IEditionDetail = {
  ...current2026, description: null, participants: [], draws: [], matches: [], bracket: [],
  pools: Array.from({ length: 8 }, (_, index) => ({ id: `p${index}`, rank: index + 1, participantCount: 5, matchCount: 10 })) as unknown as IEditionDetail['pools'],
  rounds: [{ id: 'r1', kind: ROUND_KIND.POOLS, sequence: 1, status: ROUND_STATUS.PLAYING, matchCount: 105, validatedMatchCount: 68 }]
}

describe('aperçu de l’accueil (fonctions pures)', () => {
  it('l’édition en cours est la plus récente qui n’est pas close, null si toutes le sont', () => {
    expect(selectCurrentEdition([closed2025, current2026, closed2024])?.code).toBe('2026')
    expect(selectCurrentEdition([closed2025, closed2024])).toBeNull()
  })

  it('le champion est celui de la dernière édition close', () => {
    expect(selectChampion([closed2024, closed2025, current2026])).toMatchObject({ year: 2025, titles: 4 })
    expect(selectChampion([current2026])).toBeNull()
  })

  it('aucun score non validé n’est un score public', () => {
    expect(toLatestScore(match('m1', MATCH_STATUS.VALIDATED, [5, 4]))).toMatchObject({ winnerScore: 5, loserScore: 4, poolRank: 4 })
    expect(toLatestScore(match('m2', MATCH_STATUS.SCHEDULED, [5, 4]))).toBeNull()
    expect(toLatestScore(match('m3', MATCH_STATUS.RECORDED, [5, 4]))).toBeNull()
    expect(toLatestScore(match('m4', MATCH_STATUS.VALIDATED, [5, null]))).toBeNull()
  })

  it('les compteurs d’archive viennent de GET /stats, jamais d’une somme des matchCount des éditions', () => {
    const overview = buildHomeOverview({ editions: [current2026, closed2025], stats, detail, matches: [], ranking })
    expect(overview.archive).toMatchObject({ editions: 16, competitors: 145, matches: 729, scoredMatches: 554, firstYear: 2025 })
    expect(overview.current?.progress).toMatchObject({ validated: 68, total: 105, poolCount: 8, participantCount: 45 })
    expect(overview.ranking).toHaveLength(3)
  })

  it('sans édition publiée, rien n’est inventé', () => {
    const overview = buildHomeOverview({ editions: [], stats: { ...stats, editions: 0 }, detail: null, matches: [], ranking: [] })
    expect(overview).toMatchObject({ hasEditions: false, current: null, target: null, champion: null })
  })
})

const overviewOf = (editions: IEditionSummary[], matches: IMatch[] = [], withDetail = true): IHomeOverview =>
  buildHomeOverview({ editions, stats, detail: withDetail ? detail : null, matches, ranking })

describe('HomeCurrentEdition : états', () => {
  it('aucune édition en cours : message dédié, ni barre ni scores ni lien', async () => {
    const wrapper = await mountSuspended(HomeCurrentEdition, { ...withRouterLink, props: { current: overviewOf([closed2025]).current } })
    expect(wrapper.get('[data-cy="home-current-none"]').text()).toContain('Aucune édition en cours')
    expect(wrapper.find('[data-cy="home-current-progress"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="home-current-more"]').exists()).toBe(false)
  })

  it('édition en cours sans résultat : avancement affiché, message « aucun score validé »', async () => {
    const wrapper = await mountSuspended(HomeCurrentEdition, { ...withRouterLink, props: { current: overviewOf([current2026, closed2025]).current } })
    expect(wrapper.get('[data-cy="home-current-meta"]').text()).toContain('68 / 105 matchs de poule validés')
    expect(wrapper.get('[data-cy="home-current-no-scores"]').text()).toContain('Aucun score validé')
    expect(wrapper.find('[data-cy="home-current-score"]').exists()).toBe(false)
  })

  it('les derniers scores sont les validés seulement, avec la poule', async () => {
    const matches = [match('m1', MATCH_STATUS.VALIDATED, [5, 4], 4), match('m2', MATCH_STATUS.SCHEDULED, [5, 1], 2)]
    const wrapper = await mountSuspended(HomeCurrentEdition, { ...withRouterLink, props: { current: overviewOf([current2026], matches).current } })
    const rows = wrapper.findAll('[data-cy="home-current-score"]')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.text()).toContain('Manon Faure')
    expect(rows[0]!.text()).toContain('Poule 4')
  })
})

describe('HomeBento : tuile d’archive (A16)', () => {
  it('le libellé validé est composé de paramètres, le nom accessible reprend les valeurs de GET /stats', async () => {
    const wrapper = await mountSuspended(HomeBento, { ...withRouterLink, props: { overview: overviewOf([current2026, closed2025]) } })
    const tile = wrapper.get('[data-cy="home-tile-matches"]')
    expect(tile.get('.sr-only').text()).toBe(`${stats.matches} matchs joués depuis 2025, dont ${stats.scoredMatches} avec score`)
    expect(tile.text()).toContain(String(stats.matches))
    expect(wrapper.get('[data-cy="home-tile-editions"]').text()).toContain(String(stats.editions))
  })

  it('le classement ACP montre le top 3 avec les points à deux décimales', async () => {
    const wrapper = await mountSuspended(HomeBento, { ...withRouterLink, props: { overview: overviewOf([current2026, closed2025]) } })
    const rows = wrapper.findAll('[data-cy="home-rank-row"]')
    expect(rows).toHaveLength(3)
    expect(rows[0]!.text()).toContain('49.00')
  })
})

describe('page d’accueil : états', () => {
  let served: IEditionSummary[] = []
  let failing = false
  registerEndpoint('/api/v1/editions', defineEventHandler((event) => {
    if (failing) {
      setResponseStatus(event, 500)
      return { statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'x' }
    }
    return served
  }))
  registerEndpoint('/api/v1/stats', defineEventHandler(() => stats))
  registerEndpoint('/api/v1/classements/acp', defineEventHandler(() => ranking))
  registerEndpoint('/api/v1/editions/id-2026', defineEventHandler(() => detail))
  registerEndpoint('/api/v1/editions/id-2026/matchs', defineEventHandler((event) => {
    expect(getQuery(event).statut).toBe(HOME_MATCHES_QUERY.statut.join(','))
    return { items: [match('m1', MATCH_STATUS.VALIDATED, [5, 4])], total: 1, page: 1, pageSize: 4 }
  }))
  beforeEach(() => {
    failing = false
    clearNuxtData('home-overview')
  })

  it('aucune édition publiée : état vide, sans tuiles', async () => {
    served = []
    const wrapper = await mountSuspended(HomePage, withRouterLink)
    await vi.waitFor(() => expect(wrapper.find('[data-cy="async-state-empty"]').exists()).toBe(true))
    expect(wrapper.find('[data-cy="home-bento"]').exists()).toBe(false)
  })

  it('édition en cours : le bento montre l’avancement et le dernier score validé', async () => {
    served = [current2026, closed2025]
    const wrapper = await mountSuspended(HomePage, withRouterLink)
    await vi.waitFor(() => expect(wrapper.find('[data-cy="home-current-meta"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="home-current-meta"]').text()).toContain('68 / 105')
    expect(wrapper.findAll('[data-cy="home-current-score"]')).toHaveLength(1)
  })

  it('erreur serveur : alerte avec Réessayer, le hero reste affiché', async () => {
    failing = true
    const wrapper = await mountSuspended(HomePage, withRouterLink)
    await vi.waitFor(() => expect(wrapper.find('[data-cy="async-state-error"]').exists()).toBe(true))
    expect(wrapper.find('[data-cy="home-hero"]').exists()).toBe(true)
  })
})
