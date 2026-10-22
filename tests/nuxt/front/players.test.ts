import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { COMPETITOR_SORT, SORT_ORDER } from '../../../src/enums/competitor-sort.enum'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { FINAL_STAGE } from '../../../src/enums/participation.enum'
import type { ICompetitorDetail, ICompetitorListItem } from '../../../src/interfaces/competitor.interface'
import type { IHeadToHeadSummary } from '../../../src/interfaces/head-to-head.interface'
import { CompetitorService } from '../../../src/services/competitor.service'
import {
  buildHeadToHeadLink,
  buildPageItems,
  buildPlayersApiQuery,
  buildPlayersLocationQuery,
  getInitials,
  matchesSearch,
  normalizeSearchText,
  parsePlayersState,
  splitEditionCode
} from '../../../src/utils/player.util'
import PlayerOpponents from '~/components/players/PlayerOpponents.vue'
import PlayerStats from '~/components/players/PlayerStats.vue'
import PlayersDirectory from '~/components/players/PlayersDirectory.vue'
import PlayerPage from '~/pages/joueurs/[id].vue'
import PlayersPage from '~/pages/joueurs/index.vue'

const withRouterLink = { global: { components: { RouterLink } } }

const PLAYER_ID = '00000000-0000-4000-0001-000000000009'

const identity = (id: string, displayName: string, nickname: string | null = null) => ({ id, displayName, firstName: null, lastName: null, nickname, avatarUrl: null })

const listItem = (index: number, overrides: Partial<ICompetitorListItem> = {}): ICompetitorListItem => ({
  ...identity(`00000000-0000-4000-0001-${String(index).padStart(12, '0')}`, `Joueur Numéro${String(index).padStart(3, '0')}`),
  editionsPlayed: 1,
  matchesPlayed: 5,
  wins: 3,
  losses: 2,
  unknownResults: 0,
  titles: 0,
  firstEditionCode: '2020',
  ...overrides
})

const MIXED_ITEM = listItem(500, { displayName: 'Nicolas Deseine', editionsPlayed: 4, matchesPlayed: 8, wins: 5, losses: 3, unknownResults: 2, titles: 1 })

const DIRECTORY_TOTAL = 145
const DIRECTORY_PAGE = Array.from({ length: 20 }, (_, index) => listItem(index + 1))

const DETAIL: ICompetitorDetail = {
  ...identity(PLAYER_ID, 'Alix Bernard', 'Rebond'),
  stats: { played: 79, wins: 56, losses: 23, unknownResults: 0, pointsFor: 400, pointsAgainst: 300, titles: 1 },
  participations: [
    { editionId: 'e-2014', editionCode: '2014', year: 2014, editionName: null, editionStatus: EDITION_STATUS.CLOSED, finalStage: FINAL_STAGE.QUARTER, points: 2.88, poolRank: 1 },
    { editionId: 'e-2020', editionCode: '2020', year: 2020, editionName: null, editionStatus: EDITION_STATUS.CLOSED, finalStage: FINAL_STAGE.CHAMPION, points: 14.4, poolRank: 1 },
    { editionId: 'e-2026', editionCode: '2026', year: 2026, editionName: null, editionStatus: EDITION_STATUS.POOLS_PLAYING, finalStage: null, points: null, poolRank: 5 }
  ]
}

const summary = (id: string, name: string, overrides: Partial<IHeadToHeadSummary> = {}): IHeadToHeadSummary => ({
  competitor: identity(PLAYER_ID, DETAIL.displayName),
  opponent: identity(id, name),
  played: 4,
  wins: 2,
  losses: 2,
  winRatio: 0.5,
  pointsFor: 0,
  pointsAgainst: 0,
  differential: 0,
  ...overrides
})

const OPPONENTS = [
  summary('00000000-0000-4000-0001-000000000005', 'Maya Legrand'),
  summary('00000000-0000-4000-0001-000000000006', 'Lou Bernard', { wins: 0, losses: 4, winRatio: 0 })
]

const notFound = () => defineEventHandler((event) => {
  setResponseStatus(event, 404)
  return { statusCode: 404, code: API_ERROR_CODE.NOT_FOUND, message: 'Competitor not found' }
})

const registerDirectory = () => {
  const listHandler = vi.fn((event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]) => {
    const query = getQuery(event)
    const q = typeof query.q === 'string' ? query.q : ''
    const items = q === 'zzzz' ? [] : DIRECTORY_PAGE
    return { items, total: q === 'zzzz' ? 0 : DIRECTORY_TOTAL, page: 1, pageSize: 20 }
  })
  registerEndpoint('/api/v1/competiteurs', defineEventHandler(listHandler))
  registerEndpoint('/api/v1/editions', defineEventHandler(() => []))
  registerEndpoint('/api/v1/stats', defineEventHandler(() => ({ editions: 16, competitors: DIRECTORY_TOTAL, matches: 729, scoredMatches: 554, unknownResultMatches: 175 })))
  return listHandler
}

const registerProfile = (opponents: IHeadToHeadSummary[] = OPPONENTS) => {
  registerEndpoint(`/api/v1/competiteurs/${PLAYER_ID}`, defineEventHandler(() => DETAIL))
  registerEndpoint(`/api/v1/competiteurs/${PLAYER_ID}/face-a-face`, defineEventHandler(() => opponents))
  registerEndpoint('/api/v1/competiteurs/00000000-0000-4000-0001-000000009999', notFound())
}

beforeEach(() => {
  clearNuxtData()
})

describe('recherche des joueurs : accents et casse', () => {
  it('trouve « Remi » et « Rémi », « andrea » et « Andréa »', () => {
    expect(matchesSearch(['Rémi Durand'], 'Remi')).toBe(true)
    expect(matchesSearch(['Remi Durand'], 'rémi')).toBe(true)
    expect(matchesSearch(['Andréa Martin'], 'andrea')).toBe(true)
    expect(matchesSearch(['Andrea Martin'], 'ANDRÉA')).toBe(true)
    expect(matchesSearch(['Rémi Durand'], 'Andrea')).toBe(false)
    expect(normalizeSearchText('  Éloïse ')).toBe('eloise')
  })

  it('le service transmet la recherche, le tri et l’ordre à l’API (la recherche insensible aux accents est faite par le serveur)', async () => {
    const handler = vi.fn((event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]) => ({ items: [], total: 0, page: 1, pageSize: 20, received: getQuery(event) }))
    registerEndpoint('/api/v1/competiteurs', defineEventHandler(handler))
    await new CompetitorService().list({ q: 'remi', sort: COMPETITOR_SORT.WINS, order: SORT_ORDER.DESC, page: 2, pageSize: 20 })
    const query = getQuery(handler.mock.calls[0]![0])
    expect(query).toMatchObject({ q: 'remi', sort: 'wins', order: 'desc', page: '2', pageSize: '20' })
  })

  it('la liste des adversaires est lue sans paramètre adversaire', async () => {
    const handler = vi.fn((event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]) => (getQuery(event).adversaire === undefined ? OPPONENTS : []))
    registerEndpoint(`/api/v1/competiteurs/${PLAYER_ID}/face-a-face`, defineEventHandler(handler))
    const opponents = await new CompetitorService().opponents(PLAYER_ID)
    expect(opponents).toHaveLength(2)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('état de la recherche dans l’URL', () => {
  const base = { q: '', edition: '', sort: COMPETITOR_SORT.DISPLAY_NAME, order: SORT_ORDER.ASC, page: 1 }

  it('relit l’état depuis la query, avec des valeurs par défaut sûres', () => {
    expect(parsePlayersState({ q: 'dup', edition: 'abc', tri: COMPETITOR_SORT.WINS, ordre: SORT_ORDER.ASC, page: '3' })).toEqual({ q: 'dup', edition: 'abc', sort: COMPETITOR_SORT.WINS, order: SORT_ORDER.ASC, page: 3 })
    expect(parsePlayersState({ tri: COMPETITOR_SORT.WINS })).toMatchObject({ sort: COMPETITOR_SORT.WINS, order: SORT_ORDER.DESC })
    expect(parsePlayersState({ tri: 'nimporte', ordre: 'x', page: '-4' })).toEqual(base)
  })

  it('n’écrit dans l’URL que ce qui s’écarte des défauts', () => {
    expect(buildPlayersLocationQuery(base)).toEqual({})
    expect(buildPlayersLocationQuery({ q: 'dup', edition: 'abc', sort: COMPETITOR_SORT.TITLES, order: SORT_ORDER.ASC, page: 2 })).toEqual({ q: 'dup', edition: 'abc', tri: 'titles', ordre: 'asc', page: '2' })
    expect(buildPlayersLocationQuery({ ...base, sort: COMPETITOR_SORT.WINS, order: SORT_ORDER.DESC })).toEqual({ tri: 'wins' })
  })

  it('n’envoie pas une recherche de moins de 2 caractères à l’API (400)', () => {
    expect(buildPlayersApiQuery({ ...base, q: 'd' }).q).toBeUndefined()
    expect(buildPlayersApiQuery({ ...base, q: '  du ' }).q).toBe('du')
    expect(buildPlayersApiQuery({ ...base, q: 'x'.repeat(80) }).q).toHaveLength(50)
    expect(buildPlayersApiQuery({ ...base, order: SORT_ORDER.DESC })).toMatchObject({ order: 'desc', pageSize: 20 })
  })

  it('formate les éditions, les initiales et la pagination', () => {
    expect(splitEditionCode('2012b')).toEqual({ year: '2012', suffix: 'b' })
    expect(splitEditionCode('2024')).toEqual({ year: '2024', suffix: null })
    expect(getInitials('Maël Bonnet')).toBe('MB')
    expect(buildHeadToHeadLink('a', 'b')).toBe('/joueurs/face-a-face?a=a&b=b')
    expect(buildHeadToHeadLink('a')).toBe('/joueurs/face-a-face?a=a')
    expect(buildPageItems(1, 8, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(buildPageItems(1, 20, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, null, 20])
    expect(buildPageItems(10, 20, 8)).toEqual([1, null, 7, 8, 9, 10, 11, 12, null, 20])
    expect(buildPageItems(20, 20, 8)).toEqual([1, null, 14, 15, 16, 17, 18, 19, 20])
  })
})

describe('R-5 : bilan sur les seuls matchs avec score', () => {
  it('la donnée mêle matchs avec et sans score : joués = victoires + défaites', () => {
    expect(MIXED_ITEM.matchesPlayed).toBe(MIXED_ITEM.wins + MIXED_ITEM.losses)
    expect(MIXED_ITEM.unknownResults).toBeGreaterThan(0)
  })

  it('la fiche annonce « 2 matchs au résultat inconnu » et ne montre aucun ratio', async () => {
    const wrapper = await mountSuspended(PlayerStats, { props: { played: 8, wins: 5, losses: 3, unknownResults: 2 } })
    expect(wrapper.get('[data-cy="player-stat-played"]').text()).toBe('8')
    expect(wrapper.get('[data-cy="player-stat-wins"]').text()).toBe('5')
    expect(wrapper.get('[data-cy="player-stat-losses"]').text()).toBe('3')
    expect(wrapper.get('[data-cy="player-unknown-results"]').text()).toBe('2 matchs au résultat inconnu')
    expect(wrapper.text()).not.toContain('%')
    expect(wrapper.findAll('.player-stats__label')).toHaveLength(3)
  })

  it('singulier, et rien quand tous les matchs ont un score ; joueur sans score connu', async () => {
    const one = await mountSuspended(PlayerStats, { props: { played: 4, wins: 3, losses: 1, unknownResults: 1 } })
    expect(one.get('[data-cy="player-unknown-results"]').text()).toBe('1 match au résultat inconnu')
    const none = await mountSuspended(PlayerStats, { props: { played: 4, wins: 3, losses: 1, unknownResults: 0 } })
    expect(none.find('[data-cy="player-unknown-results"]').exists()).toBe(false)
    const noScore = await mountSuspended(PlayerStats, { props: { played: 0, wins: 0, losses: 0, unknownResults: 3 } })
    expect(noScore.get('[data-cy="player-stat-played"]').text()).toBe('0')
    expect(noScore.get('[data-cy="player-unknown-results"]').text()).toBe('3 matchs au résultat inconnu')
  })

  it('l’annuaire annonce les matchs au résultat inconnu à côté de « Matchs »', async () => {
    const wrapper = await mountSuspended(PlayersDirectory, {
      ...withRouterLink,
      props: { items: [MIXED_ITEM], total: 1, page: 1, pageSize: 20, sort: COMPETITOR_SORT.DISPLAY_NAME, order: SORT_ORDER.ASC, editionFiltered: false }
    })
    const row = wrapper.get('tbody tr')
    expect(row.get('[data-cy="players-unknown-results"]').text()).toBe('2 matchs au résultat inconnu')
    expect(row.text()).toContain('8')
    expect(wrapper.find('[data-cy="players-career-note"]').exists()).toBe(false)
  })

  it('quand l’annuaire est filtré par édition, il précise que les statistiques sont celles de la carrière', async () => {
    const wrapper = await mountSuspended(PlayersDirectory, {
      ...withRouterLink,
      props: { items: [MIXED_ITEM], total: 1, page: 1, pageSize: 20, sort: COMPETITOR_SORT.DISPLAY_NAME, order: SORT_ORDER.ASC, editionFiltered: true }
    })
    expect(wrapper.get('[data-cy="players-career-note"]').text()).toContain('toute la carrière')
  })
})

describe('adversaires : ordre du serveur, winRatio null, résultats inconnus (G11)', () => {
  it('affiche l’ordre reçu, « Aucun score connu » sans ratio, jamais 0 %, et un lien au nom accessible complet', async () => {
    const wrapper = await mountSuspended(PlayerOpponents, {
      ...withRouterLink,
      props: {
        playerId: PLAYER_ID,
        opponents: [
          summary('00000000-0000-4000-0001-000000000005', 'Maya Legrand'),
          summary('00000000-0000-4000-0001-000000000016', 'Côme Garnier', { played: 0, wins: 0, losses: 0, winRatio: null }),
          summary('00000000-0000-4000-0001-000000000001', 'Abel Zéro', { wins: 1, losses: 0, winRatio: 1, played: 1 })
        ]
      }
    })
    const names = wrapper.findAll('[data-cy="player-opponent"] .player-link__name').map(node => node.text())
    expect(names).toEqual(['Maya Legrand', 'Côme Garnier', 'Abel Zéro'])
    const records = wrapper.findAll('[data-cy="player-opponent-record"]').map(node => node.text())
    expect(records[0]).toBe('2 V – 2 D')
    expect(records[1]).toBe('Aucun score connu')
    expect(wrapper.text()).not.toContain('0 %')
    const links = wrapper.findAll('[data-cy="player-opponent-link"]')
    expect(links[0]!.text()).toContain('Face-à-face avec Maya Legrand')
    expect(links[0]!.attributes('href')).toBe(`/joueurs/face-a-face?a=${PLAYER_ID}&b=00000000-0000-4000-0001-000000000005`)
  })

  it('une paire dont tous les matchs sont au résultat inconnu annonce le nombre de matchs, sans ratio', async () => {
    const unknownPair = { ...summary('00000000-0000-4000-0001-000000000016', 'Côme Garnier', { played: 0, wins: 0, losses: 0, winRatio: null }), unknownResults: 3 }
    const wrapper = await mountSuspended(PlayerOpponents, { ...withRouterLink, props: { playerId: PLAYER_ID, opponents: [unknownPair] } })
    expect(wrapper.get('[data-cy="player-opponent-record"]').text()).toBe('3 matchs au résultat inconnu')
    expect(wrapper.get('.player-opponents__count').text()).toBe('3 matchs')
    expect(wrapper.text()).not.toContain('%')
  })
})

describe('adversaires : lien « Voir tous » (F-04-ADV)', () => {
  it('absent sans hasMore, présent avec hasMore et pointant vers le face-à-face du joueur', async () => {
    const without = await mountSuspended(PlayerOpponents, { ...withRouterLink, props: { playerId: PLAYER_ID, opponents: OPPONENTS } })
    expect(without.find('[data-cy="player-opponents-see-all"]').exists()).toBe(false)
    const withMore = await mountSuspended(PlayerOpponents, { ...withRouterLink, props: { playerId: PLAYER_ID, opponents: OPPONENTS, hasMore: true } })
    expect(withMore.get('[data-cy="player-opponents-see-all"]').attributes('href')).toBe(`/joueurs/face-a-face?a=${PLAYER_ID}`)
  })

  it('la page n’affiche que 4 adversaires, dans l’ordre reçu, et le lien seulement au-delà', async () => {
    const many = Array.from({ length: 6 }, (_, index) => summary(`00000000-0000-4000-0001-0000000007${index}`, `Adversaire ${index}`))
    registerProfile(many)
    const wrapper = await mountSuspended(PlayerPage, { ...withRouterLink, route: `/joueurs/${PLAYER_ID}` })
    await flushPromises()
    const names = wrapper.findAll('[data-cy="player-opponent"] .player-link__name').map(node => node.text())
    expect(names).toEqual(['Adversaire 0', 'Adversaire 1', 'Adversaire 2', 'Adversaire 3'])
    expect(wrapper.find('[data-cy="player-opponents-see-all"]').exists()).toBe(true)
    registerProfile(many.slice(0, 4))
    clearNuxtData()
    const four = await mountSuspended(PlayerPage, { ...withRouterLink, route: `/joueurs/${PLAYER_ID}` })
    await flushPromises()
    expect(four.findAll('[data-cy="player-opponent"]')).toHaveLength(4)
    expect(four.find('[data-cy="player-opponents-see-all"]').exists()).toBe(false)
  })
})

describe('pages', () => {
  it('/joueurs : titre unique, compteur annoncé en role=status, 20 lignes, pagination', async () => {
    registerDirectory()
    const wrapper = await mountSuspended(PlayersPage, { ...withRouterLink, route: '/joueurs' })
    await flushPromises()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('[data-cy="players-count"]').attributes('role')).toBe('status')
    expect(wrapper.get('[data-cy="players-count"]').text()).toBe('145 joueurs · tri par nom')
    expect(wrapper.findAll('tbody tr')).toHaveLength(20)
    expect(wrapper.get('[data-cy="players-pager-range"]').text()).toBe('1–20 sur 145')
    expect(wrapper.find('form[role="search"]').exists()).toBe(true)
  })

  it('/joueurs?q=zzzz : résultat vide annoncé', async () => {
    registerDirectory()
    const wrapper = await mountSuspended(PlayersPage, { ...withRouterLink, route: '/joueurs?q=zzzz' })
    await flushPromises()
    expect(wrapper.get('[data-cy="players-count"]').text()).toBe('Aucun joueur trouvé')
    expect(wrapper.find('[data-cy="async-state-empty"]').exists()).toBe(true)
    expect(wrapper.findAll('tbody tr')).toHaveLength(0)
  })

  it('/joueurs/[id] : statistiques, sans ratio, parcours dans l’ordre chronologique, aucun email ni téléphone', async () => {
    registerProfile()
    const wrapper = await mountSuspended(PlayerPage, { ...withRouterLink, route: `/joueurs/${PLAYER_ID}` })
    await flushPromises()
    expect(wrapper.get('[data-cy="page-title"]').text()).toBe('Alix Bernard')
    expect(wrapper.get('[data-cy="player-stat-played"]').text()).toBe('79')
    expect(wrapper.get('[data-cy="player-stat-wins"]').text()).toBe('56')
    expect(wrapper.get('[data-cy="player-stat-losses"]').text()).toBe('23')
    expect(wrapper.get('[data-cy="player-stats"]').text()).not.toContain('%')
    const years = wrapper.findAll('[data-cy="player-journey-table"] tbody tr td:first-child').map(cell => cell.text())
    expect(years).toEqual(['2026', '2020', '2014'])
    expect(wrapper.findAll('[data-cy="player-opponent"]')).toHaveLength(2)
    expect(wrapper.get('[data-cy="player-compare"]').attributes('href')).toBe(`/joueurs/face-a-face?a=${PLAYER_ID}`)
    expect(wrapper.html()).not.toMatch(/@|\b0\d \d\d \d\d\b/)
  })

  it('/joueurs/[id] : identifiant inconnu = état « introuvable »', async () => {
    registerProfile()
    const wrapper = await mountSuspended(PlayerPage, { ...withRouterLink, route: '/joueurs/00000000-0000-4000-0001-000000009999' })
    await flushPromises()
    expect(wrapper.get('[data-cy="async-state-empty"]').text()).toContain('Joueur introuvable')
    expect(wrapper.find('[data-cy="player-header"]').exists()).toBe(false)
  })

  it('/joueurs/[id] : un joueur sans adversaire rencontré affiche l’état vide', async () => {
    registerProfile([])
    const wrapper = await mountSuspended(PlayerPage, { ...withRouterLink, route: `/joueurs/${PLAYER_ID}` })
    await flushPromises()
    expect(wrapper.find('[data-cy="player-opponents"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Aucun adversaire rencontré avec un score connu')
  })
})
