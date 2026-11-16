import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { TIEBREAK_FORMAT } from '../../src/enums/domain.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../src/enums/match.enum'
import { PARTICIPATION_STATUS, FINAL_STAGE } from '../../src/enums/participation.enum'
import { QUALIFICATION_ROUTE, TIEBREAK_SCOPE } from '../../src/enums/qualification.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IAdminMatch } from '../../src/interfaces/admin-match.interface'
import type { IApiError } from '../../src/interfaces/error.interface'
import type { IMatchValidationResult } from '../../src/interfaces/score.interface'
import type { IQualificationResult, IQualificationStatus, ITiebreakGroup } from '../../src/interfaces/qualification.interface'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum'
import type { IAdminDraw } from '../../src/interfaces/draw.interface'
import { DrawEntity } from '../../src/server/db/typeorm/entities/draw.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { MatchSideEntity } from '../../src/server/db/typeorm/entities/match-side.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { clearPool, cyclePool, seedPoolStage } from './helpers/seed-pool-stage'
import type { IPoolStageFixture } from './helpers/seed-pool-stage'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'

describe('qualification, tiebreaks and the qualified list (B-13)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource = await resetTestDatabase()
  await seedUser(dataSource, { email: 'boss-b13@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  await seedUser(dataSource, { email: 'player-b13@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  // 2061 : deux poules nettes. b2 a un meilleur cap's average que a2, donc il prend la place de meilleur 2e.
  const clear = await seedPoolStage(dataSource, { code: '2061', rank: 1, pools: [clearPool('a'), clearPool('b', 3, 0)] })
  // 2062 : un match de poule reste à jouer.
  const pending = await seedPoolStage(dataSource, { code: '2062', rank: 2, pools: [clearPool('p'), clearPool('q')], pendingMatches: 1 })
  // 2063 : égalité parfaite à trois dans la poule 1 (chacun une victoire, mêmes scores).
  const poolTie = await seedPoolStage(dataSource, { code: '2063', rank: 3, pools: [cyclePool('c'), clearPool('d')] })
  // 2064 : deux poules identiques : le 2e de chaque poule est à égalité pour une place de meilleur 2e (entre poules).
  const boundary = await seedPoolStage(dataSource, { code: '2064', rank: 4, pools: [clearPool('e'), clearPool('f')] })
  // 2065 : quatre poules identiques, deux places de meilleur 2e pour quatre ex æquo (R-7).
  const multi = await seedPoolStage(dataSource, { code: '2065', rank: 5, pools: [clearPool('g'), clearPool('h'), clearPool('i'), clearPool('j')] })
  // 2067 : trois poules identiques, deux places de meilleur 2e pour trois ex æquo : un départage à trois, puis un 1v1 entre ses deux perdants (R-7).
  const triple = await seedPoolStage(dataSource, { code: '2067', rank: 7, pools: [clearPool('k'), clearPool('l'), clearPool('m')] })
  // 2171 : égalité parfaite à trois dans la poule 1 (départage de poule) et une poule nette (poule 2). 2172 : égalité de frontière.
  const poolTie2 = await seedPoolStage(dataSource, { code: '2171', rank: 21, pools: [cyclePool('k'), clearPool('l')] })
  const boundary2 = await seedPoolStage(dataSource, { code: '2172', rank: 22, pools: [clearPool('m'), clearPool('n')] })
  // 2068 : rouverture (B-25) ; 2069 : rouverture refusée une fois le tirage du premier tour validé.
  const reopenable = await seedPoolStage(dataSource, { code: '2068', rank: 8, pools: [clearPool('r'), clearPool('s')] })
  const locked = await seedPoolStage(dataSource, { code: '2069', rank: 9, pools: [clearPool('t'), clearPool('u')] })
  const unseeded = await dataSource.getRepository(EditionEntity).save({
    code: '2066', year: 2166, chronologicalRank: 6, status: EDITION_STATUS.REGISTRATION, origin: EDITION_ORIGIN.APP
  })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000' }
  })

  let adminCookie = ''
  let participantCookie = ''
  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login('boss-b13@ccc.test', PASSWORD))
    participantCookie = cookieHeaderOf(await login('player-b13@ccc.test', PASSWORD))
  })
  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const send = (method: string, path: string, cookie?: string, body?: unknown, headers: Record<string, string> = {}) =>
    fetch(path, {
      method,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  const status = async (fixture: IPoolStageFixture, query = ''): Promise<IQualificationStatus> => {
    const response = await send('GET', `/api/v1/admin/editions/${fixture.edition.id}/qualification${query}`, adminCookie)
    expect(response.status).toBe(200)
    return await response.json() as IQualificationStatus
  }
  const finalize = (fixture: IPoolStageFixture, body: unknown) =>
    send('POST', `/api/v1/editions/${fixture.edition.id}/qualification`, adminCookie, body)
  const reopen = (fixture: IPoolStageFixture) => send('DELETE', `/api/v1/editions/${fixture.edition.id}/qualification`, adminCookie)
  const idsOf = (fixture: IPoolStageFixture, ...names: string[]): string[] => names.map((name) => fixture.participationByName.get(name)!.id)
  const errorOf = async (response: Response): Promise<IApiError> => await response.json() as IApiError
  const adminMatches = async (fixture: IPoolStageFixture, query = ''): Promise<IAdminMatch[]> => {
    const response = await send('GET', `/api/v1/admin/editions/${fixture.edition.id}/matchs${query}`, adminCookie)
    expect(response.status).toBe(200)
    return await response.json() as IAdminMatch[]
  }
  /** Saisit puis valide un match (B-12) avec la version renvoyée par chaque écriture ; `scores` suit l'ordre des côtés. */
  const play = async (match: IAdminMatch, scores: number[]): Promise<IMatchValidationResult> => {
    const body = { scores: match.sides.map((side, index) => ({ participationId: side.participationId, score: scores[index]! })) }
    const recorded = await send('PUT', `/api/v1/matchs/${match.id}/score`, adminCookie, body, { 'If-Match': `"${match.version}"` })
    expect(recorded.status).toBe(200)
    const after = await recorded.json() as IAdminMatch
    const validated = await send('POST', `/api/v1/matchs/${match.id}/validation`, adminCookie, body, { 'If-Match': `"${after.version}"` })
    expect(validated.status).toBe(200)
    return await validated.json() as IMatchValidationResult
  }
  const createTiebreak = (fixture: IPoolStageFixture, participationIds: string[], parameters?: { topPerPool: number, bestNextCount: number }) =>
    send('POST', `/api/v1/editions/${fixture.edition.id}/departages`, adminCookie, { participationIds, ...(parameters ? { parameters } : {}) })

  it('answers 401 to an anonymous caller and 403 to a participant on every route, before any data is read', async () => {
    const routes: Array<[string, string, unknown]> = [
      ['GET', `/api/v1/admin/editions/${clear.edition.id}/qualification`, undefined],
      ['POST', `/api/v1/editions/${clear.edition.id}/qualification`, { topPerPool: 1, bestNextCount: 0, withPlayoff: false }],
      ['DELETE', `/api/v1/editions/${clear.edition.id}/qualification`, undefined],
      ['POST', `/api/v1/editions/${clear.edition.id}/departages`, { participationIds: idsOf(clear, 'a1', 'a2') }]
    ]
    for (const [method, path, body] of routes) {
      expect((await send(method, path, undefined, body)).status, path).toBe(401)
      const forbidden = await send(method, path, participantCookie, body)
      expect(forbidden.status, path).toBe(403)
    }
  })

  describe('GET /admin/editions/{id}/qualification', () => {
    it('reports the pools and no qualified list without parameters, no-store', async () => {
      const response = await send('GET', `/api/v1/admin/editions/${clear.edition.id}/qualification`, adminCookie)
      expect(response.headers.get('cache-control')).toBe('no-store')
      const state = await response.json() as IQualificationStatus
      expect(state).toMatchObject({ listFinalized: false, parameters: null, pendingMatchCount: 0, ties: [], qualified: null, tiebreakMatches: [] })
      expect(state.pools).toHaveLength(2)
    })

    it('simulates the qualified list with ?topPerPool=&bestNextCount=: the n first plus the m best (n+1)th, by ratio then cap\'s average (A10)', async () => {
      const state = await status(clear, '?topPerPool=1&bestNextCount=1')
      const byRoute = (route: QUALIFICATION_ROUTE) => state.qualified!.filter((entry) => entry.route === route).map((entry) => entry.participationId).sort()
      expect(byRoute(QUALIFICATION_ROUTE.TOP_OF_POOL)).toEqual(idsOf(clear, 'a1', 'b1').sort())
      expect(byRoute(QUALIFICATION_ROUTE.BEST_NEXT)).toEqual(idsOf(clear, 'b2'))
      expect(state.qualified!.find((entry) => entry.participationId === idsOf(clear, 'b2')[0])).toMatchObject({ poolRank: 2 })
    })

    it('refuses parameters out of bounds or incomplete with 400 VALIDATION_FAILED', async () => {
      for (const query of ['?topPerPool=4&bestNextCount=0', '?topPerPool=1&bestNextCount=3', '?topPerPool=0&bestNextCount=0', '?topPerPool=1', '?topPerPool=x&bestNextCount=0']) {
        const response = await send('GET', `/api/v1/admin/editions/${clear.edition.id}/qualification${query}`, adminCookie)
        expect(response.status, query).toBe(400)
        expect((await errorOf(response)).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
      }
    })

    it('reports a pool tie that touches the frontier, as a blocking group of three (R-1)', async () => {
      const state = await status(poolTie, '?topPerPool=1&bestNextCount=0')
      expect(state.qualified).toEqual([])
      expect(state.ties).toHaveLength(1)
      expect(state.ties[0]).toMatchObject({ scope: TIEBREAK_SCOPE.POOL, poolId: poolTie.pools[0]!.id, format: TIEBREAK_FORMAT.MULTI_SIDES, startRank: 1 })
      expect(state.ties[0]!.members.map((member) => member.participationId).sort()).toEqual(idsOf(poolTie, 'c1', 'c2', 'c3').sort())
    })
  })

  describe('POST /editions/{id}/qualification', () => {
    it('refuses with 409 QUALIFICATION_NOT_READY while a pool match is not validated, with the count', async () => {
      const response = await finalize(pending, { topPerPool: 1, bestNextCount: 0, withPlayoff: false })
      expect(response.status).toBe(409)
      const body = await errorOf(response)
      expect(body.code).toBe(API_ERROR_CODE.QUALIFICATION_NOT_READY)
      expect(body.details).toMatchObject({ pendingMatchCount: 1 })
      expect((await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: pending.edition.id })).status).toBe(EDITION_STATUS.POOLS_DRAWN)
    })

    it('refuses with 409 QUALIFICATION_NOT_READY before the pools are drawn', async () => {
      const response = await send('POST', `/api/v1/editions/${unseeded.id}/qualification`, adminCookie, { topPerPool: 1, bestNextCount: 0, withPlayoff: false })
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.QUALIFICATION_NOT_READY)
    })

    it('refuses with 409 TIEBREAK_REQUIRED, listing the tied group, while a tie is not played (RG19, RG20)', async () => {
      const response = await finalize(poolTie, { topPerPool: 1, bestNextCount: 0, withPlayoff: false })
      expect(response.status).toBe(409)
      const body = await errorOf(response)
      expect(body.code).toBe(API_ERROR_CODE.TIEBREAK_REQUIRED)
      expect((body.details as { ties: ITiebreakGroup[] }).ties).toHaveLength(1)
    })

    it('refuses an out-of-bounds parameter with 400, and a malformed body with 400', async () => {
      expect((await finalize(clear, { topPerPool: 4, bestNextCount: 0, withPlayoff: false })).status).toBe(400)
      expect((await finalize(clear, { topPerPool: 1, bestNextCount: 0 })).status).toBe(400)
      expect((await finalize(clear, { topPerPool: 1, bestNextCount: 0, withPlayoff: false, extra: true })).status).toBe(400)
    })

    it('finalizes the list: QUALIFIED/ELIMINATED statuses, POOL_ELIMINATED stage, pool places, edition QUALIFIED; then R-3 blocks a pool correction', async () => {
      const response = await finalize(clear, { topPerPool: 1, bestNextCount: 1, withPlayoff: false })
      expect(response.status).toBe(200)
      const result = await response.json() as IQualificationResult
      expect(result).toMatchObject({ editionStatus: EDITION_STATUS.QUALIFIED, replayed: false, eliminatedCount: 3 })
      expect(result.qualified).toHaveLength(3)

      const participations = await dataSource.getRepository(ParticipationEntity).findBy({ editionId: clear.edition.id })
      const byId = new Map(participations.map((participation) => [participation.id, participation]))
      for (const name of ['a1', 'b1', 'b2']) {
        expect(byId.get(idsOf(clear, name)[0]!)).toMatchObject({ status: PARTICIPATION_STATUS.QUALIFIED, finalStage: null })
      }
      for (const name of ['a2', 'a3', 'b3']) {
        expect(byId.get(idsOf(clear, name)[0]!)).toMatchObject({ status: PARTICIPATION_STATUS.ELIMINATED, finalStage: FINAL_STAGE.POOL_ELIMINATED })
      }
      expect(byId.get(idsOf(clear, 'a1')[0]!)!.poolRank).toBe(1)
      expect(byId.get(idsOf(clear, 'a3')[0]!)!.poolRank).toBe(3)

      const state = await status(clear)
      expect(state).toMatchObject({ listFinalized: true, parameters: { topPerPool: 1, bestNextCount: 1, withPlayoff: false } })

      const [match] = await adminMatches(clear)
      const correction = await send('POST', `/api/v1/matchs/${match!.id}/correction`, adminCookie, {
        scores: match!.sides.map((side, index) => ({ participationId: side.participationId, score: index === 0 ? 5 : 2 }))
      }, { 'If-Match': `"${match!.version}"` })
      expect(correction.status).toBe(409)
      expect((await errorOf(correction)).code).toBe(API_ERROR_CODE.NEXT_ROUND_ENGAGED)
    })

    it('is idempotent: the same parameters answer 200 with replayed true and change nothing; other parameters answer 409 QUALIFICATION_ALREADY_DONE', async () => {
      const replay = await finalize(clear, { topPerPool: 1, bestNextCount: 1, withPlayoff: false })
      expect(replay.status).toBe(200)
      const result = await replay.json() as IQualificationResult
      expect(result.replayed).toBe(true)
      expect(result.qualified).toHaveLength(3)

      const other = await finalize(clear, { topPerPool: 2, bestNextCount: 0, withPlayoff: false })
      expect(other.status).toBe(409)
      expect((await errorOf(other)).code).toBe(API_ERROR_CODE.QUALIFICATION_ALREADY_DONE)
      const tiebreak = await createTiebreak(clear, idsOf(clear, 'a2', 'b2'))
      expect(tiebreak.status).toBe(409)
      expect((await errorOf(tiebreak)).code).toBe(API_ERROR_CODE.QUALIFICATION_ALREADY_DONE)
    })
  })

  describe('POST /editions/{id}/departages', () => {
    it('refuses a group that is not a current tie with 409 TIEBREAK_NOT_REQUIRED', async () => {
      const response = await createTiebreak(poolTie, idsOf(poolTie, 'c1', 'c2'))
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.TIEBREAK_NOT_REQUIRED)
      const stranger = await createTiebreak(poolTie, [...idsOf(poolTie, 'c1'), ...idsOf(clear, 'a1')])
      expect(stranger.status).toBe(409)
    })

    it('creates a three-sided pool tiebreak (target 3), idempotently, listed in the admin matches with purpose TIEBREAK and its pool', async () => {
      const created = await createTiebreak(poolTie, idsOf(poolTie, 'c1', 'c2', 'c3'))
      expect(created.status).toBe(201)
      const match = await created.json() as IAdminMatch
      expect(match).toMatchObject({ purpose: MATCH_PURPOSE.TIEBREAK, targetScore: 3, status: MATCH_STATUS.SCHEDULED, poolRank: 1 })
      expect(match.sides).toHaveLength(3)

      const again = await createTiebreak(poolTie, idsOf(poolTie, 'c3', 'c2', 'c1'))
      expect(again.status).toBe(200)
      expect((await again.json() as IAdminMatch).id).toBe(match.id)

      const listed = (await adminMatches(poolTie)).filter((candidate) => candidate.purpose === MATCH_PURPOSE.TIEBREAK)
      expect(listed.map((candidate) => candidate.id)).toEqual([match.id])
      expect((await status(poolTie, '?topPerPool=1&bestNextCount=0')).tiebreakMatches.map((candidate) => candidate.id)).toEqual([match.id])
    })

    it('a played tiebreak closes the tie (3-1-0): the winner takes the place, the list can be finalized (R-1, R-2)', async () => {
      const [match] = (await adminMatches(poolTie)).filter((candidate) => candidate.purpose === MATCH_PURPOSE.TIEBREAK)
      const winner = match!.sides[0]!.participationId
      await play(match!, [3, 1, 0])
      const state = await status(poolTie, '?topPerPool=1&bestNextCount=0')
      expect(state.ties).toEqual([])
      expect(state.qualified!.map((entry) => entry.participationId)).toContain(winner)

      const result = await finalize(poolTie, { topPerPool: 1, bestNextCount: 0, withPlayoff: false })
      expect(result.status).toBe(200)
      expect((await result.json() as IQualificationResult).qualified).toHaveLength(2)
    })

    it('creates a tiebreak BETWEEN pools without a pool, needing the parameters, and lists it with a null pool rank', async () => {
      const tied = await status(boundary, '?topPerPool=1&bestNextCount=1')
      expect(tied.ties).toHaveLength(1)
      expect(tied.ties[0]).toMatchObject({ scope: TIEBREAK_SCOPE.BOUNDARY, poolId: null, format: TIEBREAK_FORMAT.ONE_VS_ONE, slots: 1 })
      const ids = tied.ties[0]!.members.map((member) => member.participationId)

      const withoutParameters = await createTiebreak(boundary, ids)
      expect(withoutParameters.status).toBe(409)
      expect((await errorOf(withoutParameters)).code).toBe(API_ERROR_CODE.TIEBREAK_NOT_REQUIRED)

      const created = await createTiebreak(boundary, ids, { topPerPool: 1, bestNextCount: 1 })
      expect(created.status).toBe(201)
      const match = await created.json() as IAdminMatch
      expect(match).toMatchObject({ purpose: MATCH_PURPOSE.TIEBREAK, targetScore: 5, poolRank: null })
      expect((await adminMatches(boundary)).some((candidate) => candidate.id === match.id)).toBe(true)
      expect((await adminMatches(boundary, '?poule=1')).some((candidate) => candidate.id === match.id)).toBe(false)

      await play(match, [5, 2])
      const done = await finalize(boundary, { topPerPool: 1, bestNextCount: 1, withPlayoff: false })
      expect(done.status).toBe(200)
      const qualified = (await done.json() as IQualificationResult).qualified
      expect(qualified.filter((entry) => entry.route === QUALIFICATION_ROUTE.BEST_NEXT).map((entry) => entry.participationId)).toEqual([match.sides[0]!.participationId])
    })

    it('R-7: four tied players for two places need a 4-sided tiebreak, then a 3-sided one between its losers; the two qualified are the two winners', async () => {
      const parameters = { topPerPool: 1, bestNextCount: 2 }
      const first = (await status(multi, '?topPerPool=1&bestNextCount=2')).ties
      expect(first).toHaveLength(1)
      expect(first[0]).toMatchObject({ format: TIEBREAK_FORMAT.MULTI_SIDES, slots: 2 })
      expect(first[0]!.members).toHaveLength(4)

      const four = await createTiebreak(multi, first[0]!.members.map((member) => member.participationId), parameters)
      expect(four.status).toBe(201)
      const fourMatch = await four.json() as IAdminMatch
      expect(fourMatch).toMatchObject({ targetScore: 3 })
      expect(fourMatch.sides).toHaveLength(4)
      await play(fourMatch, [3, 1, 2, 0])
      const firstWinner = fourMatch.sides[0]!.participationId

      const second = (await status(multi, '?topPerPool=1&bestNextCount=2')).ties
      expect(second).toHaveLength(1)
      expect(second[0]!.members).toHaveLength(3)
      expect(second[0]!.slots).toBe(1)
      expect(second[0]!.members.map((member) => member.participationId)).not.toContain(firstWinner)

      const three = await createTiebreak(multi, second[0]!.members.map((member) => member.participationId), parameters)
      expect(three.status).toBe(201)
      const threeMatch = await three.json() as IAdminMatch
      expect(threeMatch.sides).toHaveLength(3)
      await play(threeMatch, [3, 0, 1])
      const secondWinner = threeMatch.sides[0]!.participationId

      const done = await finalize(multi, { topPerPool: 1, bestNextCount: 2, withPlayoff: false })
      expect(done.status).toBe(200)
      const qualified = await done.json() as IQualificationResult
      expect(qualified.qualified.filter((entry) => entry.route === QUALIFICATION_ROUTE.BEST_NEXT).map((entry) => entry.participationId).sort())
        .toEqual([firstWinner, secondWinner].sort())
    })

    it('R-7 end to end: three tied players for two places need a 3-sided tiebreak (3-1-0), then a 1v1 between its two losers; the two qualified are the two winners', async () => {
      const parameters = { topPerPool: 1, bestNextCount: 2 }
      const query = '?topPerPool=1&bestNextCount=2'
      const first = (await status(triple, query)).ties
      expect(first).toHaveLength(1)
      expect(first[0]).toMatchObject({ scope: TIEBREAK_SCOPE.BOUNDARY, format: TIEBREAK_FORMAT.MULTI_SIDES, slots: 2 })
      expect(first[0]!.members).toHaveLength(3)

      const three = await createTiebreak(triple, first[0]!.members.map((member) => member.participationId), parameters)
      expect(three.status).toBe(201)
      const threeMatch = await three.json() as IAdminMatch
      expect(threeMatch).toMatchObject({ purpose: MATCH_PURPOSE.TIEBREAK, targetScore: 3 })
      expect(threeMatch.sides).toHaveLength(3)
      await play(threeMatch, [3, 1, 0])
      const firstWinner = threeMatch.sides[0]!.participationId
      const losers = [threeMatch.sides[1]!.participationId, threeMatch.sides[2]!.participationId]

      // R-2 : malgré 1 et 0, les deux perdants restent ex æquo.
      const second = (await status(triple, query)).ties
      expect(second).toHaveLength(1)
      expect(second[0]).toMatchObject({ format: TIEBREAK_FORMAT.ONE_VS_ONE, slots: 1 })
      expect(second[0]!.members.map((member) => member.participationId).sort()).toEqual([...losers].sort())
      expect(second[0]!.members.map((member) => member.participationId)).not.toContain(firstWinner)

      const duel = await createTiebreak(triple, losers, parameters)
      expect(duel.status).toBe(201)
      const duelMatch = await duel.json() as IAdminMatch
      expect(duelMatch).toMatchObject({ purpose: MATCH_PURPOSE.TIEBREAK, targetScore: 5 })
      expect(duelMatch.sides).toHaveLength(2)
      await play(duelMatch, [5, 2])
      const secondWinner = duelMatch.sides[0]!.participationId

      const done = await finalize(triple, { topPerPool: 1, bestNextCount: 2, withPlayoff: false })
      expect(done.status).toBe(200)
      const result = await done.json() as IQualificationResult
      expect(result.qualified.filter((entry) => entry.route === QUALIFICATION_ROUTE.BEST_NEXT).map((entry) => entry.participationId).sort())
        .toEqual([firstWinner, secondWinner].sort())
    })
  })

  describe('CORRECTION-TIEBREAK and DELETE /editions/{id}/departages/{matchId} (B-24)', () => {
    const removeTiebreak = (fixture: IPoolStageFixture, matchId: string, cookie: string | undefined = adminCookie) =>
      send('DELETE', `/api/v1/editions/${fixture.edition.id}/departages/${matchId}`, cookie)
    /** Le match de poule (REGULAR) du joueur `name`, relu pour avoir sa version courante. */
    const poolMatchOf = async (fixture: IPoolStageFixture, name: string): Promise<IAdminMatch> =>
      (await adminMatches(fixture)).find((match) => match.purpose === MATCH_PURPOSE.REGULAR
        && match.sides.some((side) => side.participationId === fixture.participationByName.get(name)!.id))!
    /** Même score qu'à la validation (vainqueur 5, perdant 3) : la correction réussit sans changer le résultat. */
    const correctPoolMatch = (match: IAdminMatch) =>
      send('POST', `/api/v1/matchs/${match.id}/correction`, adminCookie, {
        scores: match.sides.map((side) => ({ participationId: side.participationId, score: side.score })) }, { 'If-Match': `"${match.version}"` })
    const tiedC = () => idsOf(poolTie2, 'k1', 'k2', 'k3')

    it('answers 401 and 403 before reading anything, and 404 for an unknown match, a non-tiebreak match or another edition', async () => {
      const path = `/api/v1/editions/${poolTie2.edition.id}/departages/${poolTie2.matches[0]!.id}`
      expect((await send('DELETE', path)).status).toBe(401)
      expect((await send('DELETE', path, participantCookie)).status).toBe(403)

      expect((await removeTiebreak(poolTie2, '00000000-0000-4000-8000-000000000000')).status).toBe(404)
      expect((await removeTiebreak(poolTie2, poolTie2.matches[0]!.id)).status).toBe(404) // un match de poule, pas un départage
      const created = await (await createTiebreak(poolTie2, tiedC())).json() as IAdminMatch
      expect((await removeTiebreak(clear, created.id)).status).toBe(404) // un départage d'une autre édition
      expect((await send('DELETE', `/api/v1/editions/${poolTie2.edition.id}/departages/not-a-uuid`, adminCookie)).status).toBe(400)
      expect((await removeTiebreak(poolTie2, created.id)).status).toBe(204) // remis à zéro pour la suite
    })

    it('refuses to correct a pool match of the pool of a tiebreak (TIEBREAK_ENGAGED), but accepts another pool', async () => {
      const created = await (await createTiebreak(poolTie2, tiedC())).json() as IAdminMatch
      const refused = await correctPoolMatch(await poolMatchOf(poolTie2, 'k1'))
      expect(refused.status).toBe(409)
      expect((await errorOf(refused)).code).toBe(API_ERROR_CODE.TIEBREAK_ENGAGED)

      const other = await correctPoolMatch(await poolMatchOf(poolTie2, 'l1'))
      expect(other.status).toBe(200)

      // Un départage joué, même validé, engage toujours la poule.
      await play(created, [3, 1, 0])
      const afterPlay = await correctPoolMatch(await poolMatchOf(poolTie2, 'k1'))
      expect(afterPlay.status).toBe(409)
      expect((await errorOf(afterPlay)).code).toBe(API_ERROR_CODE.TIEBREAK_ENGAGED)
    })

    it('refuses to delete a played tiebreak with 409 TIEBREAK_PLAYED', async () => {
      const [played] = (await adminMatches(poolTie2)).filter((match) => match.purpose === MATCH_PURPOSE.TIEBREAK)
      const response = await removeTiebreak(poolTie2, played!.id)
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.TIEBREAK_PLAYED)
      expect((await adminMatches(poolTie2)).some((match) => match.id === played!.id)).toBe(true)
    })

    it('a boundary tiebreak (no pool) blocks the correction of every pool match of the edition', async () => {
      const parameters = { topPerPool: 1, bestNextCount: 1 }
      const tied = (await status(boundary2, '?topPerPool=1&bestNextCount=1')).ties[0]!.members.map((member) => member.participationId)
      const created = await (await createTiebreak(boundary2, tied, parameters)).json() as IAdminMatch
      expect(created.poolRank).toBeNull()
      for (const name of ['m1', 'n1']) {
        const refused = await correctPoolMatch(await poolMatchOf(boundary2, name))
        expect(refused.status, name).toBe(409)
        expect((await errorOf(refused)).code, name).toBe(API_ERROR_CODE.TIEBREAK_ENGAGED)
      }
      expect((await removeTiebreak(boundary2, created.id)).status).toBe(204)
      expect((await correctPoolMatch(await poolMatchOf(boundary2, 'm1'))).status).toBe(200)
    })

    it('deletes an unplayed tiebreak (204): the tie comes back, the correction works again, and the tiebreak can be created again', async () => {
      const fresh = await seedPoolStage(dataSource, { code: '2173', rank: 23, pools: [cyclePool('q'), clearPool('r')] })
      const ids = idsOf(fresh, 'q1', 'q2', 'q3')
      const created = await (await createTiebreak(fresh, ids)).json() as IAdminMatch
      expect((await status(fresh, '?topPerPool=1&bestNextCount=0')).tiebreakMatches.map((match) => match.id)).toEqual([created.id])

      const removed = await removeTiebreak(fresh, created.id)
      expect(removed.status).toBe(204)
      expect(removed.headers.get('cache-control')).toBe('no-store')
      expect(await dataSource.getRepository(MatchSideEntity).countBy({ matchId: created.id })).toBe(0)
      const state = await status(fresh, '?topPerPool=1&bestNextCount=0')
      expect(state.tiebreakMatches).toEqual([])
      expect(state.ties).toHaveLength(1)

      expect((await correctPoolMatch(await poolMatchOf(fresh, 'q1'))).status).toBe(200)
      const again = await createTiebreak(fresh, ids)
      expect(again.status).toBe(201)
      expect((await again.json() as IAdminMatch).id).not.toBe(created.id)
      expect((await removeTiebreak(fresh, created.id)).status).toBe(404)
    })

    it('refuses with 409 EDITION_CLOSED on a closed edition', async () => {
      const closed = await seedPoolStage(dataSource, { code: '2174', rank: 24, pools: [cyclePool('s'), clearPool('t')] })
      const created = await (await createTiebreak(closed, idsOf(closed, 's1', 's2', 's3'))).json() as IAdminMatch
      await dataSource.getRepository(EditionEntity).update({ id: closed.edition.id }, { status: EDITION_STATUS.CLOSED })
      const response = await removeTiebreak(closed, created.id)
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.EDITION_CLOSED)
    })
  })

  describe('DELETE /editions/{id}/qualification (B-25)', () => {
    const participationsOf = (fixture: IPoolStageFixture) =>
      dataSource.getRepository(ParticipationEntity).findBy({ editionId: fixture.edition.id })
    const editionOf = (fixture: IPoolStageFixture) => dataSource.getRepository(EditionEntity).findOneByOrFail({ id: fixture.edition.id })
    const openDraft = (fixture: IPoolStageFixture) => send('POST', `/api/v1/editions/${fixture.edition.id}/tirages/tour`, adminCookie, {})

    it('reopens the list: configuration and ranks erased, players back IN_POOL, edition back to POOLS_DRAWN, the round draft deleted', async () => {
      expect((await finalize(reopenable, { topPerPool: 2, bestNextCount: 0, withPlayoff: false })).status).toBe(200)
      const draft = await openDraft(reopenable)
      expect(draft.status).toBe(201)
      expect(await dataSource.getRepository(DrawEntity).countBy({ editionId: reopenable.edition.id, kind: DRAW_KIND.ROUND })).toBe(1)

      const response = await reopen(reopenable)
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
      const state = await response.json() as IQualificationStatus
      expect(state).toMatchObject({ listFinalized: false, parameters: null, qualified: null })

      expect(await dataSource.getRepository(DrawEntity).countBy({ editionId: reopenable.edition.id, kind: DRAW_KIND.ROUND })).toBe(0)
      const edition = await editionOf(reopenable)
      expect(edition.status).toBe(EDITION_STATUS.POOLS_DRAWN)
      expect(edition.qualification).toBeNull()
      for (const participation of await participationsOf(reopenable)) {
        expect(participation).toMatchObject({ status: PARTICIPATION_STATUS.IN_POOL, poolRank: null, finalStage: null })
      }
    })

    it('is idempotent: replayed on a reopened edition it answers 200 and changes nothing, and the list can be finalized again', async () => {
      const replay = await reopen(reopenable)
      expect(replay.status).toBe(200)
      expect((await editionOf(reopenable)).status).toBe(EDITION_STATUS.POOLS_DRAWN)
      const again = await finalize(reopenable, { topPerPool: 1, bestNextCount: 0, withPlayoff: false })
      expect(again.status).toBe(200)
      expect(((await again.json()) as IQualificationResult).qualified).toHaveLength(2)
    })

    it('refuses with 409 QUALIFICATION_NOT_DONE before the pools are drawn', async () => {
      const response = await send('DELETE', `/api/v1/editions/${unseeded.id}/qualification`, adminCookie)
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.QUALIFICATION_NOT_DONE)
    })

    it('refuses with 409 QUALIFICATION_LOCKED once the first round draw is validated, and changes nothing', async () => {
      expect((await finalize(locked, { topPerPool: 2, bestNextCount: 0, withPlayoff: false })).status).toBe(200)
      const draw = await (await openDraft(locked)).json() as IAdminDraw
      const [t1, t2, u1, u2] = idsOf(locked, 't1', 't2', 'u1', 'u2')
      const pairs = [[t1!, u2!], [u1!, t2!]]
      const assignments = pairs.flatMap((pair, pairIndex) => pair.map((participationId, side) => ({
        participationId, pairingIndex: pairIndex + 1, sidePosition: side + 1, drawnOrder: pairIndex * 2 + side + 1
      })))
      expect((await send('PUT', `/api/v1/tirages/${draw.id}/affectations`, adminCookie, { assignments })).status).toBe(200)
      expect((await send('POST', `/api/v1/tirages/${draw.id}/validation`, adminCookie)).status).toBe(200)

      const response = await reopen(locked)
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.QUALIFICATION_LOCKED)
      expect((await editionOf(locked)).status).toBe(EDITION_STATUS.PLAYOFFS)
      expect((await editionOf(locked)).qualification).not.toBeNull()
      expect(await dataSource.getRepository(DrawEntity).countBy({ editionId: locked.edition.id, status: DRAW_STATUS.VALIDATED })).toBe(1)
    })

    it('refuses with 409 EDITION_CLOSED on a closed edition', async () => {
      await dataSource.getRepository(EditionEntity).update({ id: reopenable.edition.id }, { status: EDITION_STATUS.CLOSED })
      const response = await reopen(reopenable)
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.EDITION_CLOSED)
    })
  })
})
