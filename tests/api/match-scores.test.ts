import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { EDITION_STATUS } from '../../src/enums/edition.enum'
import { MATCH_STATUS } from '../../src/enums/match.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IAdminMatch } from '../../src/interfaces/admin-match.interface'
import type { IApiError } from '../../src/interfaces/error.interface'
import type { IMatch } from '../../src/interfaces/match.interface'
import type { IPaginated } from '../../src/interfaces/pagination.interface'
import type { IMatchValidationResult } from '../../src/interfaces/score.interface'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { MatchSideEntity } from '../../src/server/db/typeorm/entities/match-side.entity'
import { MatchEntity } from '../../src/server/db/typeorm/entities/match.entity'
import { RoundEntity } from '../../src/server/db/typeorm/entities/round.entity'
import { cookieHeaderOf, login, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { seedKnockoutEdition } from './helpers/seed-scoring'
import { SECRET_MATCH_COMMENT, seedPublicEditions } from './helpers/seed-public-editions'
import { requireTestDatabaseEnv } from './helpers/test-database'

const env = requireTestDatabaseEnv()

describe('match scores (B-12)', async () => {
  Object.assign(process.env, env)
  const { default: dataSource } = await import('../../src/server/db/typeorm/data-source')
  await dataSource.initialize()
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
  const fixture = await seedPublicEditions(dataSource)
  const knockout = await seedKnockoutEdition(dataSource, { code: '2027', year: 2027, chronologicalRank: 4, withFinalDraw: false })
  const engagedKnockout = await seedKnockoutEdition(dataSource, { code: '2028', year: 2028, chronologicalRank: 5, withFinalDraw: true })
  const admin = await seedUser(dataSource, { email: 'admin-b12@example.test', password: 'Sup3r-secret-b12!', role: USER_ROLE.ADMIN })
  const participant = await seedUser(dataSource, {
    email: 'player-b12@example.test', password: 'Sup3r-secret-b12!', role: USER_ROLE.PARTICIPANT, withCompetitor: true
  })

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

  let adminCookie = ''
  let participantCookie = ''
  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login(admin.email, admin.password))
    participantCookie = cookieHeaderOf(await login(participant.email, participant.password))
  })
  const live = fixture.editions.live

  const send = (method: string, path: string, cookie: string | undefined, body?: unknown, headers: Record<string, string> = {}) =>
    fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  const scoreBody = (match: IAdminMatch, values: number[]) => ({
    scores: match.sides.map((side, index) => ({ participationId: side.participationId, score: values[index]! }))
  })
  const adminList = async (editionId: string, query = ''): Promise<IAdminMatch[]> => {
    const response = await send('GET', `/api/v1/admin/editions/${editionId}/matchs${query}`, adminCookie)
    expect(response.status).toBe(200)
    return await response.json() as IAdminMatch[]
  }
  const adminMatchBySequence = async (editionId: string, sequence: number): Promise<IAdminMatch> =>
    (await adminList(editionId)).find((match) => match.sequence === sequence)!
  const errorOf = async (response: Response): Promise<IApiError> => await response.json() as IApiError
  const putScore = (match: IAdminMatch, values: number[], headers: Record<string, string> = {}) =>
    send('PUT', `/api/v1/matchs/${match.id}/score`, adminCookie, scoreBody(match, values), headers)
  const validate = (match: IAdminMatch, values: number[], headers: Record<string, string> = {}) =>
    send('POST', `/api/v1/matchs/${match.id}/validation`, adminCookie, scoreBody(match, values), headers)
  const correct = (match: IAdminMatch, values: number[], headers: Record<string, string> = {}) =>
    send('POST', `/api/v1/matchs/${match.id}/correction`, adminCookie, scoreBody(match, values), headers)
  const publicMatches = async (): Promise<IMatch[]> => {
    const response = await fetch(`/api/v1/editions/${live.id}/matchs`)
    expect(response.status).toBe(200)
    return (await response.json() as IPaginated<IMatch>).items
  }
  const editionEtag = async (): Promise<string> => {
    const response = await fetch(`/api/v1/editions/${live.id}`)
    expect(response.status).toBe(200)
    return response.headers.get('etag')!
  }

  it('refuses anonymous callers (401) and participants (403) on every score route', async () => {
    const match = await adminMatchBySequence(live.id, 3)
    const body = scoreBody(match, [5, 3])
    const calls = [
      () => send('PUT', `/api/v1/matchs/${match.id}/score`, undefined, body),
      () => send('POST', `/api/v1/matchs/${match.id}/validation`, undefined, body),
      () => send('POST', `/api/v1/matchs/${match.id}/correction`, undefined, body, { 'If-Match': '"1"' }),
      () => send('GET', `/api/v1/admin/editions/${live.id}/matchs`, undefined)
    ]
    const expectNoAdminField = (text: string): void => {
      expect(text).not.toContain('recordedScore')
      expect(text).not.toContain('comment')
      expect(text).not.toContain(SECRET_MATCH_COMMENT)
    }
    for (const call of calls) {
      const response = await call()
      expect(response.status).toBe(401)
      expectNoAdminField(await response.text())
    }
    const asParticipant = [
      () => send('PUT', `/api/v1/matchs/${match.id}/score`, participantCookie, body),
      () => send('POST', `/api/v1/matchs/${match.id}/validation`, participantCookie, body),
      () => send('POST', `/api/v1/matchs/${match.id}/correction`, participantCookie, body, { 'If-Match': '"1"' }),
      () => send('GET', `/api/v1/admin/editions/${live.id}/matchs`, participantCookie)
    ]
    for (const call of asParticipant) {
      const response = await call()
      expect(response.status).toBe(403)
      expectNoAdminField(await response.text())
    }
  })

  it('rejects malformed scores with 400', async () => {
    const match = await adminMatchBySequence(live.id, 3)
    const [first, second] = match.sides
    const stranger = fixture.liveParticipations[3]!.id
    const bodies: unknown[] = [
      { scores: [{ participationId: first!.participationId, score: -1 }, { participationId: second!.participationId, score: 3 }] },
      { scores: [{ participationId: first!.participationId, score: 1.5 }, { participationId: second!.participationId, score: 3 }] },
      { scores: [{ participationId: first!.participationId, score: 5 }] },
      { scores: [{ participationId: first!.participationId, score: 5 }, { participationId: stranger, score: 3 }] },
      { scores: [{ participationId: first!.participationId, score: 5 }, { participationId: first!.participationId, score: 3 }] },
      { scores: [{ participationId: first!.participationId, score: '5' }, { participationId: second!.participationId, score: 3 }] },
      {}
    ]
    for (const body of bodies) {
      const response = await send('PUT', `/api/v1/matchs/${match.id}/score`, adminCookie, body)
      expect(response.status, JSON.stringify(body)).toBe(400)
    }
    expect((await send('PUT', '/api/v1/matchs/not-a-uuid/score', adminCookie, scoreBody(match, [5, 3]))).status).toBe(400)
    const unknown = await send('PUT', '/api/v1/matchs/00000000-0000-4000-8000-000000000000/score', adminCookie, scoreBody(match, [5, 3]))
    expect(unknown.status).toBe(404)
  })

  it('records a score without any public effect (PUT is idempotent)', async () => {
    const etagBefore = await editionEtag()
    const before = await adminMatchBySequence(live.id, 3)
    expect(before.status).toBe(MATCH_STATUS.SCHEDULED)

    const first = await putScore(before, [5, 3])
    expect(first.status).toBe(200)
    const recorded = await first.json() as IAdminMatch
    expect(recorded.status).toBe(MATCH_STATUS.RECORDED)
    expect(recorded.sides.map((side) => side.recordedScore)).toEqual([5, 3])
    expect(recorded.sides.map((side) => side.score)).toEqual([null, null])

    const replay = await putScore(before, [5, 3])
    expect(replay.status).toBe(200)
    expect((await replay.json() as IAdminMatch).version).toBe(recorded.version)

    const publicMatch = (await publicMatches()).find((match) => match.sequence === 3)!
    expect(publicMatch.status).toBe(MATCH_STATUS.SCHEDULED)
    expect(publicMatch.sides.map((side) => side.score)).toEqual([null, null])
    const conditional = await fetch(`/api/v1/editions/${live.id}`, { headers: { 'If-None-Match': etagBefore } })
    expect(conditional.status).toBe(304)
  })

  it('never exposes recordedScore or the match comment outside the admin routes', async () => {
    const paths = [
      '/api/v1/editions', '/api/v1/stats', '/api/v1/competiteurs',
      ...[live.id, live.code].flatMap((id) => [
        `/api/v1/editions/${id}`, `/api/v1/editions/${id}/participants`, `/api/v1/editions/${id}/poules`,
        `/api/v1/editions/${id}/tours`, `/api/v1/editions/${id}/matchs`, `/api/v1/editions/${id}/tirages`
      ])
    ]
    for (const path of paths) {
      for (const cookie of [undefined, participantCookie]) {
        const text = await (await fetch(path, { headers: cookie ? { Cookie: cookie } : {} })).text()
        expect(text, path).not.toContain('recordedScore')
        expect(text, path).not.toContain('recorded_score')
        expect(text, path).not.toContain(SECRET_MATCH_COMMENT)
      }
    }
    const adminView = await adminList(live.id)
    expect(adminView.some((match) => match.comment === SECRET_MATCH_COMMENT)).toBe(true)
    expect(adminView.some((match) => match.sides.some((side) => side.recordedScore !== null))).toBe(true)
  })

  it('refuses PUT on a VALIDATED match (409 MATCH_ALREADY_VALIDATED)', async () => {
    const validated = await adminMatchBySequence(live.id, 1)
    const response = await putScore(validated, [5, 2])
    expect(response.status).toBe(409)
    expect((await errorOf(response)).code).toBe(API_ERROR_CODE.MATCH_ALREADY_VALIDATED)
  })

  it('refuses an inconsistent score on validation (422 SCORE_INCONSISTENT)', async () => {
    const recorded = await adminMatchBySequence(live.id, 2)
    expect(recorded.sides.map((side) => side.recordedScore)).toEqual([4, 2])
    const notReached = await validate(recorded, [4, 2])
    expect(notReached.status).toBe(422)
    expect((await errorOf(notReached)).code).toBe(API_ERROR_CODE.SCORE_INCONSISTENT)

    expect((await putScore(recorded, [5, 5])).status).toBe(200)
    const tie = await validate(recorded, [5, 5])
    expect(tie.status).toBe(422)
    expect((await errorOf(tie)).code).toBe(API_ERROR_CODE.SCORE_INCONSISTENT)
    expect((await adminMatchBySequence(live.id, 2)).status).toBe(MATCH_STATUS.RECORDED)

    expect((await putScore(recorded, [5, 1])).status).toBe(200)
  })

  it('refuses a stale If-Match or a score the organiser did not see (409 MATCH_VERSION_CONFLICT)', async () => {
    const current = await adminMatchBySequence(live.id, 2)
    const stale = await validate(current, [5, 1], { 'If-Match': `"${current.version - 1}"` })
    expect(stale.status).toBe(409)
    expect((await errorOf(stale)).code).toBe(API_ERROR_CODE.MATCH_VERSION_CONFLICT)

    const unseen = await validate(current, [5, 3])
    expect(unseen.status).toBe(409)
    expect((await errorOf(unseen)).code).toBe(API_ERROR_CODE.MATCH_VERSION_CONFLICT)

    expect((await validate(current, [5, 1], { 'If-Match': 'not-a-version' })).status).toBe(400)
    expect((await adminMatchBySequence(live.id, 2)).status).toBe(MATCH_STATUS.RECORDED)
  })

  it('refuses to validate a match with no recorded score (409)', async () => {
    const scheduled = await adminMatchBySequence(knockout.edition.id, 3)
    const response = await validate(scheduled, [10, 9])
    expect(response.status).toBe(409)
  })

  it('validates once and replays identically: three POSTs, one effect, then the public sees the score', async () => {
    const etagBefore = await editionEtag()
    const match = await adminMatchBySequence(live.id, 3)
    const headers = { 'If-Match': `"${match.version}"` }

    const first = await validate(match, [5, 3], headers)
    const second = await validate(match, [5, 3], headers)
    const third = await validate(match, [5, 3], headers)
    const bodies = [await first.json(), await second.json(), await third.json()] as IMatchValidationResult[]
    expect([first.status, second.status, third.status]).toEqual([200, 200, 200])
    expect(JSON.stringify(bodies[1])).toBe(JSON.stringify(bodies[0]))
    expect(JSON.stringify(bodies[2])).toBe(JSON.stringify(bodies[0]))

    const result = bodies[0]!
    expect(result.match.status).toBe(MATCH_STATUS.VALIDATED)
    expect(result.match.version).toBe(match.version + 1)
    expect(result.match.validatedBy?.id).toBe(admin.id)
    expect(result.pool).not.toBeNull()
    const [leader] = result.pool!.standing
    expect(leader!.wins).toBe(2)
    expect(leader!.pointsFor).toBe(10)
    expect(result.round.kind).toBe(ROUND_KIND.POOLS)
    expect(result.round.validatedMatchCount).toBe(2)
    expect(result.advancingParticipationIds).toEqual([])

    const sides = await dataSource.getRepository(MatchSideEntity).find({ where: { matchId: match.id }, order: { position: 'ASC' } })
    expect(sides.map((side) => side.validatedScore)).toEqual([5, 3])
    expect((await dataSource.getRepository(MatchEntity).findOneByOrFail({ id: match.id })).version).toBe(match.version + 1)

    const different = await validate(match, [5, 4])
    expect(different.status).toBe(409)
    expect((await errorOf(different)).code).toBe(API_ERROR_CODE.MATCH_ALREADY_VALIDATED)

    const publicMatch = (await publicMatches()).find((item) => item.sequence === 3)!
    expect(publicMatch.status).toBe(MATCH_STATUS.VALIDATED)
    expect(publicMatch.sides.map((side) => side.score)).toEqual([5, 3])
    const conditional = await fetch(`/api/v1/editions/${live.id}`, { headers: { 'If-None-Match': etagBefore } })
    expect(conditional.status).toBe(200)
  })

  it('serialises two simultaneous validations into exactly one effect', async () => {
    const match = await adminMatchBySequence(live.id, 2)
    const [one, two] = await Promise.all([validate(match, [5, 1]), validate(match, [5, 1])])
    expect([one.status, two.status]).toEqual([200, 200])
    const bodies = [await one.json(), await two.json()] as IMatchValidationResult[]
    expect(JSON.stringify(bodies[0])).toBe(JSON.stringify(bodies[1]))
    const stored = await dataSource.getRepository(MatchEntity).findOneByOrFail({ id: match.id })
    expect(stored.version).toBe(match.version + 1)
    expect(stored.status).toBe(MATCH_STATUS.VALIDATED)
  })

  it('validates a final 10-9 and derives the winner into the next-round pool', async () => {
    const final = await adminMatchBySequence(knockout.edition.id, 3)
    expect(final.targetScore).toBe(10)
    expect((await putScore(final, [10, 9])).status).toBe(200)
    const response = await validate(final, [10, 9])
    expect(response.status).toBe(200)
    const result = await response.json() as IMatchValidationResult
    expect(result.pool).toBeNull()
    expect(result.round.kind).toBe(ROUND_KIND.FINAL)
    expect(result.match.winnerParticipationId).toBe(final.sides[0]!.participationId)
    expect(result.advancingParticipationIds).toEqual([final.sides[0]!.participationId])

    const tiedFinal = await adminMatchBySequence(engagedKnockout.edition.id, 3)
    expect((await putScore(tiedFinal, [10, 10])).status).toBe(200)
    expect((await validate(tiedFinal, [10, 10])).status).toBe(422)
  })

  it('refuses writes on a closed edition and on a round that is not open (409)', async () => {
    const editionRepo = dataSource.getRepository(EditionEntity)
    const roundRepo = dataSource.getRepository(RoundEntity)
    const target = await adminMatchBySequence(engagedKnockout.edition.id, 3)

    await editionRepo.update({ id: engagedKnockout.edition.id }, { status: EDITION_STATUS.CLOSED })
    expect((await putScore(target, [10, 3])).status).toBe(409)
    await editionRepo.update({ id: engagedKnockout.edition.id }, { status: EDITION_STATUS.PLAYOFFS })

    await roundRepo.update({ id: engagedKnockout.finalRound.id }, { status: ROUND_STATUS.PENDING })
    expect((await putScore(target, [10, 3])).status).toBe(409)
    await roundRepo.update({ id: engagedKnockout.finalRound.id }, { status: ROUND_STATUS.DRAWN })
    expect((await putScore(target, [10, 3])).status).toBe(200)
  })

  describe('correction (A15)', () => {
    it('requires If-Match, a validated match and a consistent score', async () => {
      const match = await adminMatchBySequence(live.id, 1)
      const noHeader = await correct(match, [3, 5])
      expect(noHeader.status).toBe(400)

      const stale = await correct(match, [3, 5], { 'If-Match': `"${match.version + 5}"` })
      expect(stale.status).toBe(409)
      expect((await errorOf(stale)).code).toBe(API_ERROR_CODE.MATCH_VERSION_CONFLICT)

      const inconsistent = await correct(match, [5, 5], { 'If-Match': `"${match.version}"` })
      expect(inconsistent.status).toBe(422)
      expect((await errorOf(inconsistent)).code).toBe(API_ERROR_CODE.SCORE_INCONSISTENT)

      const notValidated = await adminMatchBySequence(knockout.edition.id, 3)
      expect(notValidated.status).toBe(MATCH_STATUS.VALIDATED)
    })

    it('is accepted before the next round is engaged: standing recomputed, public ETag moves', async () => {
      const match = await adminMatchBySequence(live.id, 1)
      const etagBefore = await editionEtag()
      const response = await correct(match, [3, 5], { 'If-Match': `"${match.version}"` })
      expect(response.status).toBe(200)
      const result = await response.json() as IMatchValidationResult
      expect(result.match.sides.map((side) => side.score)).toEqual([3, 5])
      expect(result.match.sides.map((side) => side.recordedScore)).toEqual([3, 5])
      expect(result.match.version).toBeGreaterThan(match.version)
      expect(new Date(result.match.validatedAt!).getTime()).toBeGreaterThan(new Date(match.validatedAt!).getTime())
      const winnerRow = result.pool!.standing.find((row) => row.participationId === match.sides[1]!.participationId)!
      expect(winnerRow.wins).toBeGreaterThanOrEqual(1)

      const conditional = await fetch(`/api/v1/editions/${live.id}`, { headers: { 'If-None-Match': etagBefore } })
      expect(conditional.status).toBe(200)
      const detail = await conditional.json() as { matches: IMatch[] }
      expect(detail.matches.find((item) => item.sequence === 1)!.sides.map((side) => side.score)).toEqual([3, 5])
    })

    it('is refused with 409 NEXT_ROUND_ENGAGED once the qualification is stopped (pool match)', async () => {
      const editionRepo = dataSource.getRepository(EditionEntity)
      const match = await adminMatchBySequence(live.id, 1)
      await editionRepo.update({ id: live.id }, { status: EDITION_STATUS.QUALIFIED })
      const response = await correct(match, [5, 2], { 'If-Match': `"${match.version}"` })
      await editionRepo.update({ id: live.id }, { status: EDITION_STATUS.POOLS_PLAYING })
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.NEXT_ROUND_ENGAGED)
    })

    it('follows R-3 for knockout matches: a draft draw for the next round engages it', async () => {
      const free = await adminMatchBySequence(knockout.edition.id, 1)
      const accepted = await correct(free, [10, 6], { 'If-Match': `"${free.version}"` })
      expect(accepted.status).toBe(200)

      const engaged = await adminMatchBySequence(engagedKnockout.edition.id, 1)
      const refused = await correct(engaged, [10, 6], { 'If-Match': `"${engaged.version}"` })
      expect(refused.status).toBe(409)
      expect((await errorOf(refused)).code).toBe(API_ERROR_CODE.NEXT_ROUND_ENGAGED)
    })

    it('refuses a correction on a match that is not validated', async () => {
      const recorded = await adminMatchBySequence(engagedKnockout.edition.id, 3)
      const response = await correct(recorded, [10, 2], { 'If-Match': `"${recorded.version}"` })
      expect(response.status).toBe(409)
    })
  })

  describe('admin match list (C6)', () => {
    it('returns the recorded score, the comment, the version and the author', async () => {
      const matches = await adminList(live.id)
      expect(matches.map((match) => match.sequence)).toEqual([1, 2, 3])
      for (const match of matches) {
        expect(match.comment).toBe(SECRET_MATCH_COMMENT)
        expect(typeof match.version).toBe('number')
      }
      expect(matches.find((match) => match.sequence === 3)!.validatedBy?.id).toBe(admin.id)
    })

    it('accepts a list of statuses and refuses an unknown one with 400', async () => {
      const id = engagedKnockout.edition.id
      const recorded = await adminList(id, '?statut=RECORDED')
      expect(recorded.map((match) => match.sequence)).toEqual([3])
      expect(recorded[0]!.sides.map((side) => side.recordedScore)).toEqual([10, 3])
      expect((await adminList(id, '?statut=RECORDED&statut=SCHEDULED')).length).toBe(1)
      expect((await adminList(id, '?statut=RECORDED,VALIDATED')).length).toBe(3)
      expect((await adminList(id, '?statut=VALIDATED')).map((match) => match.sequence)).toEqual([1, 2])
      expect((await adminList(id, '?statut=SCHEDULED')).length).toBe(0)
      const bogus = await send('GET', `/api/v1/admin/editions/${id}/matchs?statut=BOGUS`, adminCookie)
      expect(bogus.status).toBe(400)
      expect((await adminList(id, '?tour=SEMI')).length).toBe(2)
      expect((await adminList(live.id, '?tour=SEMI')).length).toBe(0)
      expect((await adminList(live.id, '?poule=1')).length).toBe(3)
      expect((await adminList(live.id, '?poule=2')).length).toBe(0)
      expect((await send('GET', '/api/v1/admin/editions/unknown-edition/matchs', adminCookie)).status).toBe(404)
    })
  })
})
