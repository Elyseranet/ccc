import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import type { IEditionSummary } from '../../src/interfaces/edition.interface'
import type { ICompetitorDetail, ICompetitorListItem } from '../../src/interfaces/competitor.interface'
import type { IHeadToHead, IHeadToHeadSummary } from '../../src/interfaces/head-to-head.interface'
import type { IPaginated } from '../../src/interfaces/pagination.interface'
import { PRIVATE_PHONE, resetAndSeedCompetitors } from './helpers/competitor-fixtures'
import type { ICompetitorFixtures } from './helpers/competitor-fixtures'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000'
const FORBIDDEN_KEYS = /"(email|phone|passwordHash|comment)"/
const FIXTURE_PLAYER_COUNT = 6

let ids: ICompetitorFixtures
let close: () => Promise<void>

const json = async <T>(path: string): Promise<{ status: number, body: T }> => {
  const response = await fetch(path, { headers: { Accept: 'application/json' } })
  return { status: response.status, body: await response.json() as T }
}

const names = (page: IPaginated<ICompetitorListItem>): string[] => page.items.map((item) => item.displayName)

describe('public competitor routes', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: requireTestDatabaseEnv()
  })

  beforeAll(async () => {
    const seeded = await resetAndSeedCompetitors()
    ids = seeded.ids
    close = () => seeded.dataSource.destroy()
  })

  afterAll(async () => {
    await close?.()
  })

  describe('GET /competiteurs', () => {
    it('is paginated with an exact total', async () => {
      const { status, body } = await json<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs?pageSize=2&page=2')
      expect(status).toBe(200)
      expect(body.total).toBe(FIXTURE_PLAYER_COUNT)
      expect(body.items).toHaveLength(2)
      expect(body).toMatchObject({ page: 2, pageSize: 2 })
    })

    it.each(['pageSize=0', 'pageSize=101', 'page=0', 'page=abc'])('rejects %s with 400', async (query) => {
      const { status, body } = await json<{ code: API_ERROR_CODE }>(`/api/v1/competiteurs?${query}`)
      expect(status).toBe(400)
      expect(body.code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
    })

    it('reports R-5 balances: only scored matches, unknown results aside', async () => {
      const { body } = await json<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs?pageSize=100')
      const nicolas = body.items.find((item) => item.id === ids.nicolas)!
      expect(nicolas).toMatchObject({ wins: 3, losses: 1, matchesPlayed: 4, unknownResults: 2, titles: 1, editionsPlayed: 2, firstEditionCode: ids.editionACode })
      expect(nicolas).not.toHaveProperty('winRatio')
      const lonely = body.items.find((item) => item.id === ids.lonely)!
      expect(lonely).toMatchObject({ wins: 0, losses: 0, matchesPlayed: 0, unknownResults: 1 })
    })

    it('sorts by a statistic column and rejects an unknown sort', async () => {
      const wins = await json<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs?sort=wins')
      expect(wins.body.items[0]!.id).toBe(ids.nicolas)
      const alpha = await json<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs?sort=displayName')
      expect(names(alpha.body)).toEqual([...names(alpha.body)].sort((a, b) => a.localeCompare(b)))
      const bad = await json<unknown>('/api/v1/competiteurs?sort=phone')
      expect(bad.status).toBe(400)
    })

    it('filters on the players of an edition', async () => {
      const { body } = await json<IPaginated<ICompetitorListItem>>(`/api/v1/competiteurs?edition=${ids.editionB}`)
      expect(body.items.map((item) => item.id).sort()).toEqual([ids.nicolas, ids.remi, ids.lonely].sort())
      expect((await json<unknown>('/api/v1/competiteurs?edition=nope')).status).toBe(400)
    })
  })

  describe('GET /competiteurs?q=', () => {
    it('finds accented and plain spellings case-insensitively', async () => {
      const { body } = await json<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs?q=rem')
      expect(names(body)).toEqual(expect.arrayContaining(['Rémi Durand', 'Remi Petit']))
      const accent = await json<IPaginated<ICompetitorListItem>>(`/api/v1/competiteurs?q=${encodeURIComponent('RÉMI')}`)
      expect(names(accent.body)).toEqual(expect.arrayContaining(['Rémi Durand']))
      expect(names(accent.body)).toContain('Remi Petit')
    })

    it('searches nickname, last name and aliases', async () => {
      expect(names((await json<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs?q=dese')).body)).toEqual(['Nicolas Deseine'])
      expect(names((await json<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs?q=remy-pa')).body)).toEqual(['Paul Martin'])
    })

    it('rejects a one-character query and a 51-character query', async () => {
      expect((await json<unknown>('/api/v1/competiteurs?q=a')).status).toBe(400)
      expect((await json<unknown>('/api/v1/competiteurs?q=%20a%20')).status).toBe(400)
      expect((await json<unknown>(`/api/v1/competiteurs?q=${'a'.repeat(51)}`)).status).toBe(400)
      expect((await json<unknown>(`/api/v1/competiteurs?q=${'a'.repeat(50)}`)).status).toBe(200)
    })

    it('treats % and _ literally instead of matching the whole table', async () => {
      const percent = await json<IPaginated<ICompetitorListItem>>(`/api/v1/competiteurs?q=${encodeURIComponent('%%')}`)
      expect(percent.body.total).toBe(0)
      const underscore = await json<IPaginated<ICompetitorListItem>>(`/api/v1/competiteurs?q=${encodeURIComponent('__')}`)
      expect(underscore.body.total).toBe(0)
      const literal = await json<IPaginated<ICompetitorListItem>>(`/api/v1/competiteurs?q=${encodeURIComponent('0%_')}`)
      expect(names(literal.body)).toEqual(['100%_fun'])
    })

    it('does not break on SQL metacharacters', async () => {
      const { status, body } = await json<IPaginated<ICompetitorListItem>>(`/api/v1/competiteurs?q=${encodeURIComponent("'; DROP TABLE competitors;--")}`)
      expect(status).toBe(200)
      expect(body.total).toBe(0)
      expect((await json<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs')).body.total).toBe(FIXTURE_PLAYER_COUNT)
    })
  })

  describe('GET /competiteurs/{id}', () => {
    it('returns identity, history by edition and R-5 statistics', async () => {
      const { status, body } = await json<ICompetitorDetail>(`/api/v1/competiteurs/${ids.nicolas}`)
      expect(status).toBe(200)
      expect(body.displayName).toBe('Nicolas Deseine')
      expect(body.participations.map((p) => [p.editionCode, p.finalStage, p.points])).toEqual([
        ['2020', 'FINALIST', 12.5],
        ['2021', 'CHAMPION', 30]
      ])
      expect(body.stats).toEqual({ played: 4, wins: 3, losses: 1, unknownResults: 2, pointsFor: 19, pointsAgainst: 11, titles: 1 })
      expect(body.stats).not.toHaveProperty('winRatio')
    })

    it('G2: gives each participation its pool number, its place and its edition balance (R-5)', async () => {
      const { body } = await json<ICompetitorDetail>(`/api/v1/competiteurs/${ids.nicolas}`)
      const [first, second] = body.participations
      expect(first).toMatchObject({ editionCode: '2020', poolNumber: 2, poolRank: 1, wins: 2, losses: 1, unknownResults: 1 })
      expect(second).toMatchObject({ editionCode: '2021', poolNumber: null, poolRank: null, wins: 1, losses: 0, unknownResults: 1 })
      const sum = (key: 'wins' | 'losses') => body.participations.reduce((total, p) => total + p[key], 0)
      expect([sum('wins'), sum('losses')]).toEqual([body.stats.wins, body.stats.losses])
    })

    it('returns zero statistics and a readable history for a player without any score', async () => {
      const { status, body } = await json<ICompetitorDetail>(`/api/v1/competiteurs/${ids.lonely}`)
      expect(status).toBe(200)
      expect(body.stats).toEqual({ played: 0, wins: 0, losses: 0, unknownResults: 1, pointsFor: 0, pointsAgainst: 0, titles: 0 })
      expect(body.participations).toHaveLength(1)
    })

    it('answers 400 for a malformed id and 404 COMPETITOR_NOT_FOUND for an unknown one', async () => {
      expect((await json<unknown>('/api/v1/competiteurs/not-a-uuid')).status).toBe(400)
      const missing = await json<{ code: API_ERROR_CODE }>(`/api/v1/competiteurs/${UNKNOWN_ID}`)
      expect(missing.status).toBe(404)
      expect(missing.body.code).toBe(API_ERROR_CODE.COMPETITOR_NOT_FOUND)
    })
  })

  describe('GET /competiteurs/{id}/face-a-face', () => {
    it('summarises a pair and lists counted matches only', async () => {
      const { status, body } = await json<IHeadToHead>(`/api/v1/competiteurs/${ids.nicolas}/face-a-face?adversaire=${ids.remi}`)
      expect(status).toBe(200)
      expect(body).toMatchObject({ played: 3, wins: 2, losses: 1, pointsFor: 14, pointsAgainst: 10, differential: 4 })
      expect(body.winRatio).toBeCloseTo(2 / 3)
      expect(body.matches).toHaveLength(3)
      expect(body.matches.map((m) => m.winnerCompetitorId)).toEqual([ids.nicolas, ids.remi, ids.nicolas])
      expect(body.matches[0]).toMatchObject({ editionCode: '2020', competitorScore: 5, opponentScore: 3 })
    })

    it('G3, G9, G10: opponent titles match the list, unknown results are counted apart, matches carry the pool number', async () => {
      const { body } = await json<IHeadToHead>(`/api/v1/competiteurs/${ids.nicolas}/face-a-face?adversaire=${ids.remi}`)
      const list = await json<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs?pageSize=100')
      expect(body.opponent.titles).toBe(list.body.items.find((item) => item.id === ids.remi)!.titles)
      expect(body.opponent.titles).toBe(1)
      expect(body.unknownResults).toBe(1)
      // 4 matchs REGULAR dans la paire (3 avec score, 1 inconnu) ; le départage et le score non validé sont exclus.
      expect(body.played + body.unknownResults).toBe(4)
      expect(body.matches.map((match) => match.poolNumber)).toEqual([2, 2, null])
      const pairs = await json<IHeadToHeadSummary[]>(`/api/v1/competiteurs/${ids.nicolas}/face-a-face`)
      expect(pairs.body.map((pair) => [pair.opponent.titles, pair.unknownResults])).toEqual([[1, 1], [0, 0], [0, 1]])
    })

    it('has a null ratio and no match for a pair that never played', async () => {
      const { body } = await json<IHeadToHead>(`/api/v1/competiteurs/${ids.lonely}/face-a-face?adversaire=${ids.nicolas}`)
      expect(body).toMatchObject({ played: 0, wins: 0, losses: 0, winRatio: null, matches: [] })
    })

    it('lists every pair of the player without an opponent', async () => {
      const { body } = await json<IHeadToHeadSummary[]>(`/api/v1/competiteurs/${ids.nicolas}/face-a-face`)
      expect(body.map((pair) => [pair.opponent.id, pair.played, pair.wins, pair.losses])).toEqual([
        [ids.remi, 3, 2, 1],
        [ids.paul, 1, 1, 0],
        [ids.lonely, 0, 0, 0]
      ])
    })

    it('G11: lists a pair with only unknown results, sorted by wins + losses + unknownResults then by name', async () => {
      const { body } = await json<IHeadToHeadSummary[]>(`/api/v1/competiteurs/${ids.nicolas}/face-a-face`)
      const unknownOnly = body.find((pair) => pair.opponent.id === ids.lonely)!
      expect(unknownOnly).toMatchObject({ played: 0, wins: 0, losses: 0, unknownResults: 1, winRatio: null })
      const totals = body.map((pair) => pair.wins + pair.losses + pair.unknownResults)
      expect(totals).toEqual([...totals].sort((a, b) => b - a))
      // Paul (1 match) et Zoé (1 match inconnu) sont à égalité : le nom de l'adversaire départage.
      expect(body.map((pair) => pair.opponent.displayName)).toEqual(['Rémi Durand', 'Paul Martin', 'Zoé Sansscore'])
    })

    it('rejects a malformed or identical opponent and an unknown player', async () => {
      expect((await json<unknown>(`/api/v1/competiteurs/${ids.nicolas}/face-a-face?adversaire=x`)).status).toBe(400)
      expect((await json<unknown>(`/api/v1/competiteurs/${ids.nicolas}/face-a-face?adversaire=${ids.nicolas}`)).status).toBe(400)
      const unknown = await json<{ code: API_ERROR_CODE }>(`/api/v1/competiteurs/${ids.nicolas}/face-a-face?adversaire=${UNKNOWN_ID}`)
      expect(unknown.status).toBe(404)
      expect(unknown.body.code).toBe(API_ERROR_CODE.COMPETITOR_NOT_FOUND)
    })
  })

  describe('GET /editions (G4)', () => {
    it('gives the runner-up and the final score, or null without finalist', async () => {
      const { body } = await json<IEditionSummary[]>('/api/v1/editions')
      const byCode = new Map(body.map((edition) => [edition.code, edition]))
      expect(byCode.get('2020')!.final).toEqual({ runnerUp: expect.objectContaining({ id: ids.nicolas }), runnerUpTitlesToDate: 0, score: null })
      expect(byCode.get('2021')!.final).toEqual({ runnerUp: expect.objectContaining({ id: ids.remi }), runnerUpTitlesToDate: 1, score: { champion: 5, runnerUp: 2 } })
    })
  })

  describe('privacy', () => {
    it('never serialises email, phone, password hash or admin comment on any route', async () => {
      const paths = [
        '/api/v1/editions',
        '/api/v1/competiteurs?pageSize=100',
        '/api/v1/competiteurs?q=rem',
        `/api/v1/competiteurs/${ids.nicolas}`,
        `/api/v1/competiteurs/${ids.nicolas}/face-a-face`,
        `/api/v1/competiteurs/${ids.nicolas}/face-a-face?adversaire=${ids.remi}`
      ]
      for (const path of paths) {
        const response = await fetch(path)
        const text = await response.text()
        expect(response.status, path).toBe(200)
        expect(text, path).not.toMatch(FORBIDDEN_KEYS)
        expect(text, path).not.toContain(PRIVATE_PHONE)
        expect(text, path).not.toContain('private admin note')
      }
    })
  })
})
