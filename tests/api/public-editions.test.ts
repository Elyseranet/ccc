import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'
import { MATCH_STATUS } from '../../shared/enums/match.enum'
import { ROUND_KIND } from '../../shared/enums/round.enum'
import type { IApiError } from '../../shared/interfaces/api/error.interface'
import type { IEditionDetail, IEditionParticipant, IEditionSummary } from '../../shared/interfaces/api/edition.interface'
import type { IDraw } from '../../shared/interfaces/api/draw.interface'
import type { IMatch } from '../../shared/interfaces/api/match.interface'
import type { IPaginated } from '../../shared/interfaces/api/pagination.interface'
import type { IPool } from '../../shared/interfaces/api/pool.interface'
import type { IRound } from '../../shared/interfaces/api/round.interface'
import type { IArchiveStats } from '../../shared/interfaces/api/stats.interface'
import { MatchEntity } from '../../server/database/entities/match.entity'
import { requireTestDatabaseEnv } from './helpers/test-database'
import {
  SECRET_EDITION_COMMENT,
  SECRET_MATCH_COMMENT,
  SECRET_PHONE,
  seedPublicEditions
} from './helpers/seed-public-editions'
import type { IPublicFixture } from './helpers/seed-public-editions'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

const env = requireTestDatabaseEnv()

describe('public edition reads (B-06)', async () => {
  // La base est préparée avant le démarrage du serveur : migrations, puis fixtures.
  Object.assign(process.env, env)
  const { default: dataSource } = await import('../../server/database/data-source')
  await dataSource.initialize()
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
  const fixture: IPublicFixture = await seedPublicEditions(dataSource)

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const { legacyA, legacyB, live } = fixture.editions
  const getText = async (path: string, headers: Record<string, string> = {}) => {
    const response = await fetch(path, { headers })
    return { response, text: await response.text() }
  }
  const getJson = async <T>(path: string): Promise<T> => {
    const { response, text } = await getText(path)
    expect(response.status, `${path}: ${text}`).toBe(200)
    return JSON.parse(text) as T
  }
  const allPublicPaths = (): string[] => [
    '/api/v1/editions',
    '/api/v1/stats',
    ...[live.id, live.code, legacyA.id, legacyB.id].flatMap((id) => [
      `/api/v1/editions/${id}`,
      `/api/v1/editions/${id}/participants`,
      `/api/v1/editions/${id}/poules`,
      `/api/v1/editions/${id}/tours`,
      `/api/v1/editions/${id}/matchs`,
      `/api/v1/editions/${id}/tirages`
    ])
  ]

  describe('GET /editions', () => {
    it('lists editions by descending chronological rank with champion and counters', async () => {
      const editions = await getJson<IEditionSummary[]>('/api/v1/editions')
      expect(editions.map((edition) => edition.code)).toEqual(['2026', '2012b', '2012a'])

      const b = editions.find((edition) => edition.code === '2012b')!
      expect(b.champion).toMatchObject({ competitor: { displayName: 'Alice' }, titlesToDate: 2 })
      const a = editions.find((edition) => edition.code === '2012a')!
      expect(a.champion?.titlesToDate).toBe(1)
      expect(a).toMatchObject({ matchCount: 2, scoredMatchCount: 1, unknownResultMatchCount: 1 })
      expect(editions[0]!.champion).toBeNull()
    })

    it('keeps 2012a and 2012b distinct, with N = 16 and the unidentified participants (A6)', async () => {
      const editions = await getJson<IEditionSummary[]>('/api/v1/editions')
      const a = editions.find((edition) => edition.code === '2012a')!
      const b = editions.find((edition) => edition.code === '2012b')!
      expect(a.id).not.toBe(b.id)
      expect(a).toMatchObject({ year: 2012, participantCount: 16, unidentifiedParticipantCount: 12 })
      expect(b).toMatchObject({ year: 2012, participantCount: 16, unidentifiedParticipantCount: 13 })
      expect((await getJson<IEditionDetail>(`/api/v1/editions/${a.id}`)).code).toBe('2012a')
      expect((await getJson<IEditionDetail>(`/api/v1/editions/${b.id}`)).code).toBe('2012b')
    })
  })

  describe('GET /stats', () => {
    it('counts played matches only, split into scored and unknown (A16, R-5)', async () => {
      const stats = await getJson<IArchiveStats>('/api/v1/stats')
      // 2012a : 1 validé + 1 inconnu ; 2012b : 1 validé ; 2026 : 1 validé (les 2 autres sont à jouer).
      expect(stats).toEqual({ editions: 3, competitors: 6, matches: 4, scoredMatches: 3, unknownResultMatches: 1 })
    })
  })

  describe('GET /editions/{id}', () => {
    it('serves the detail by UUID and by code', async () => {
      const byId = await getJson<IEditionDetail>(`/api/v1/editions/${live.id}`)
      const byCode = await getJson<IEditionDetail>(`/api/v1/editions/${live.code}`)
      expect(byCode).toEqual(byId)
      expect(byId.participants).toHaveLength(4)
      expect(byId.pools).toHaveLength(1)
      expect(byId.rounds).toHaveLength(2)
      expect(byId.matches).toHaveLength(3)
      expect(byId.bracket.map((round) => round.kind)).toEqual([ROUND_KIND.FINAL])
    })

    it('returns 404 for an unknown edition and 400 for a malformed id', async () => {
      const missing = await getText('/api/v1/editions/00000000-0000-4000-8000-000000000000')
      expect(missing.response.status).toBe(404)
      expect(JSON.parse(missing.text)).toMatchObject({ code: API_ERROR_CODE.NOT_FOUND })
      expect((await getText('/api/v1/editions/9999z')).response.status).toBe(404)

      const malformed = await getText('/api/v1/editions/not%20an%20id!')
      expect(malformed.response.status).toBe(400)
      expect((JSON.parse(malformed.text) as IApiError).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
    })
  })

  describe('visibility of an edition in progress (E-f)', () => {
    it('shows a recorded but unvalidated match as SCHEDULED, without any score', async () => {
      const detail = await getJson<IEditionDetail>(`/api/v1/editions/${live.id}`)
      const recorded = detail.matches.find((match) => match.id === fixture.liveMatches.recorded.id)!
      expect(recorded.status).toBe(MATCH_STATUS.SCHEDULED)
      expect(recorded.sides.map((side) => side.score)).toEqual([null, null])
      expect(recorded.winnerParticipationId).toBeNull()

      const validated = detail.matches.find((match) => match.id === fixture.liveMatches.validated.id)!
      expect(validated.status).toBe(MATCH_STATUS.VALIDATED)
      expect(validated.sides.map((side) => side.score)).toEqual([5, 2])
      expect(validated.winnerParticipationId).toBe(fixture.liveParticipations[0]!.id)
    })

    it('never serializes recordedScore, nor the RECORDED status, on any public route', async () => {
      for (const path of allPublicPaths()) {
        const { text } = await getText(path)
        expect(text, path).not.toMatch(/recorded/i)
        expect(text, path).not.toContain(MATCH_STATUS.RECORDED)
      }
      const page = await getJson<IPaginated<IMatch>>(`/api/v1/editions/${live.id}/matchs?statut=SCHEDULED`)
      expect(page.items.flatMap((match) => match.sides.map((side) => side.score))).toEqual([null, null, null, null])
    })

    it('counts only validated matches in the pool standing', async () => {
      const [pool] = await getJson<IPool[]>(`/api/v1/editions/${live.id}/poules`)
      const byName = new Map(pool!.standing.map((row) => [row.competitor.displayName, row]))
      expect(byName.get('Alice')).toMatchObject({ played: 1, wins: 1, losses: 0, pointsFor: 5, pointsAgainst: 2, capsAverage: 3, rank: 1 })
      expect(byName.get('Bruno')).toMatchObject({ played: 1, wins: 0, losses: 1, capsAverage: -3 })
      expect(byName.get('Chloé')).toMatchObject({ played: 0, wins: 0, losses: 0 })
      expect(byName.get('David')).toMatchObject({ played: 0 })
    })

    it('exposes round counters (C3)', async () => {
      const rounds = await getJson<IRound[]>(`/api/v1/editions/${live.id}/tours`)
      expect(rounds.map((round) => round.kind)).toEqual([ROUND_KIND.POOLS, ROUND_KIND.FINAL])
      expect(rounds[0]).toMatchObject({ matchCount: 3, validatedMatchCount: 1 })
      expect(rounds[1]).toMatchObject({ matchCount: 0, validatedMatchCount: 0 })
    })

    it('lists a unknown result apart from a match to play, and keeps it out of the V/D (R-5)', async () => {
      const archive = await getJson<IPaginated<IMatch>>(`/api/v1/editions/${legacyA.id}/matchs`)
      const unknown = archive.items.find((match) => match.status === MATCH_STATUS.RESULT_UNKNOWN)!
      expect(unknown.sides.map((side) => side.score)).toEqual([null, null])
      const rounds = await getJson<IRound[]>(`/api/v1/editions/${legacyA.id}/tours`)
      expect(rounds[0]).toMatchObject({ matchCount: 2, validatedMatchCount: 1 })
    })
  })

  describe('GET /editions/{id}/tirages', () => {
    it('serves validated draws only, with their timestamp', async () => {
      const draws = await getJson<IDraw[]>(`/api/v1/editions/${live.id}/tirages`)
      expect(draws.map((draw) => draw.id)).toEqual([fixture.validatedDraw.id])
      expect(draws[0]!.validatedAt).toBe('2026-09-30T18:00:00.000Z')
      expect(draws[0]!.assignments.map((assignment) => assignment.drawnOrder)).toEqual([1, 2, 3, 4])
    })

    it('does not leak a draft draw in /tirages nor in the edition detail', async () => {
      const detail = await getJson<IEditionDetail>(`/api/v1/editions/${live.id}`)
      expect(detail.draws.map((draw) => draw.id)).toEqual([fixture.validatedDraw.id])
      for (const path of [`/api/v1/editions/${live.id}`, `/api/v1/editions/${live.id}/tirages`]) {
        expect((await getText(path)).text).not.toContain(fixture.draftDraw.id)
      }
    })
  })

  describe('GET /editions/{id}/matchs', () => {
    it('paginates and filters by status, round, pool and sorts by validation date', async () => {
      const first = await getJson<IPaginated<IMatch>>(`/api/v1/editions/${live.id}/matchs?pageSize=2`)
      expect(first).toMatchObject({ total: 3, page: 1, pageSize: 2 })
      expect(first.items.map((match) => match.sequence)).toEqual([1, 2])

      const validatedOnly = await getJson<IPaginated<IMatch>>(`/api/v1/editions/${live.id}/matchs?statut=VALIDATED`)
      expect(validatedOnly.total).toBe(1)

      const toPlay = await getJson<IPaginated<IMatch>>(`/api/v1/editions/${live.id}/matchs?statut=SCHEDULED`)
      expect(toPlay.items.map((match) => match.sequence)).toEqual([2, 3])

      const both = await getJson<IPaginated<IMatch>>(`/api/v1/editions/${live.id}/matchs?statut=SCHEDULED,VALIDATED&poule=1&tour=POOLS`)
      expect(both.total).toBe(3)
      expect((await getJson<IPaginated<IMatch>>(`/api/v1/editions/${live.id}/matchs?poule=2`)).total).toBe(0)

      const latest = await getJson<IPaginated<IMatch>>(`/api/v1/editions/${live.id}/matchs?tri=validated_at_desc`)
      expect(latest.items[0]!.id).toBe(fixture.liveMatches.validated.id)
    })

    it.each([
      ['tour=NOPE'],
      ['poule=abc'],
      ['poule=1.5'],
      ['poule=0'],
      ['statut=RECORDED'],
      ['statut=WHATEVER'],
      ['tri=score_desc'],
      ['page=0'],
      ['pageSize=1000']
    ])('answers 400 on %s', async (query) => {
      const { response, text } = await getText(`/api/v1/editions/${live.id}/matchs?${query}`)
      expect(response.status).toBe(400)
      expect((JSON.parse(text) as IApiError).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
    })
  })

  describe('GET /editions/{id}/participants', () => {
    it('lists participants without any contact field', async () => {
      const { text } = await getText(`/api/v1/editions/${live.id}/participants`)
      const participants = JSON.parse(text) as IEditionParticipant[]
      expect(participants.map((participant) => participant.competitor.displayName)).toEqual(['Alice', 'Bruno', 'Chloé', 'David'])
      expect(text).not.toContain(SECRET_PHONE)
    })
  })

  describe('privacy of every public response (A13, R-4, invariant 8)', () => {
    it('carries no email, phone, match comment or edition comment', async () => {
      for (const path of allPublicPaths()) {
        const { response, text } = await getText(path)
        expect(response.status, path).toBe(200)
        expect(text, path).not.toContain(SECRET_MATCH_COMMENT)
        expect(text, path).not.toContain(SECRET_EDITION_COMMENT)
        expect(text, path).not.toContain(SECRET_PHONE)
        expect(text, path).not.toMatch(/"(email|phone|comment|passwordHash|version|validatedBy[A-Za-z]*)"/)
      }
    })
  })

  describe('conditional caching', () => {
    it('serves a closed edition with a strong ETag and a public max-age', async () => {
      const { response } = await getText(`/api/v1/editions/${legacyA.id}`)
      expect(response.headers.get('etag')).toMatch(/^"ccc-ed-/)
      expect(response.headers.get('cache-control')).toBe('public, max-age=3600')
    })

    it('answers 304 on a valid If-None-Match, then 200 once a match is validated', async () => {
      const path = `/api/v1/editions/${live.id}/matchs`
      const first = await getText(path)
      expect(first.response.headers.get('cache-control')).toBe('no-cache')
      const etag = first.response.headers.get('etag')!
      expect(etag).toMatch(/^W\/"/)

      const revalidated = await fetch(path, { headers: { 'If-None-Match': etag } })
      expect(revalidated.status).toBe(304)
      expect(await revalidated.text()).toBe('')

      // Saisir un score ne change pas l'ETag : seule la validation fait bouger le contenu public.
      const repo = dataSource.getRepository(MatchEntity)
      await repo.update(fixture.liveMatches.scheduled.id, { status: MATCH_STATUS.RECORDED })
      expect((await fetch(path, { headers: { 'If-None-Match': etag } })).status).toBe(304)

      await repo.update(fixture.liveMatches.scheduled.id, { status: MATCH_STATUS.VALIDATED, validatedAt: new Date() })
      const after = await fetch(path, { headers: { 'If-None-Match': etag } })
      expect(after.status).toBe(200)
      expect(after.headers.get('etag')).not.toBe(etag)
    })

    it('uses a distinct ETag per URL', async () => {
      const a = (await getText(`/api/v1/editions/${legacyA.id}/matchs`)).response.headers.get('etag')
      const b = (await getText(`/api/v1/editions/${legacyA.id}/tours`)).response.headers.get('etag')
      expect(a).not.toBe(b)
    })
  })
})
