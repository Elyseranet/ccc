import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum'
import { EDITION_STATUS } from '../../src/enums/edition.enum'
import { MATCH_PURPOSE } from '../../src/enums/match.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IAdminDraw } from '../../src/interfaces/draw.interface'
import type { IApiError } from '../../src/interfaces/error.interface'
import type { IRoundDrawPreview } from '../../src/interfaces/qualification.interface'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { MatchEntity } from '../../src/server/db/typeorm/entities/match.entity'
import { RoundEntity } from '../../src/server/db/typeorm/entities/round.entity'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { clearPool, seedPoolStage } from './helpers/seed-pool-stage'
import type { IPoolStageFixture } from './helpers/seed-pool-stage'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'

describe('round draw (B-13)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource = await resetTestDatabase()
  await seedUser(dataSource, { email: 'boss-rd@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  await seedUser(dataSource, { email: 'player-rd@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  // 2071 : liste non figée. 2072 : 4 qualifiés (demies déduites). 2073 : barrages. 2074 : 6 qualifiés (tour au choix de l'admin).
  const notFinalized = await seedPoolStage(dataSource, { code: '2071', rank: 11, pools: [clearPool('a'), clearPool('b')] })
  const semis = await seedPoolStage(dataSource, { code: '2072', rank: 12, pools: [clearPool('c'), clearPool('d')] })
  const playoff = await seedPoolStage(dataSource, { code: '2073', rank: 13, pools: [clearPool('e'), clearPool('f')] })
  const chosen = await seedPoolStage(dataSource, { code: '2074', rank: 14, pools: [clearPool('g'), clearPool('h'), clearPool('i')] })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000' }
  })

  let adminCookie = ''
  let participantCookie = ''
  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login('boss-rd@ccc.test', PASSWORD))
    participantCookie = cookieHeaderOf(await login('player-rd@ccc.test', PASSWORD))
    for (const [fixture, body] of [
      [semis, { topPerPool: 2, bestNextCount: 0, withPlayoff: false }],
      [playoff, { topPerPool: 2, bestNextCount: 0, withPlayoff: true }],
      [chosen, { topPerPool: 2, bestNextCount: 0, withPlayoff: false }]
    ] as const) {
      expect((await send('POST', `/api/v1/editions/${fixture.edition.id}/qualification`, adminCookie, body)).status).toBe(200)
    }
  })
  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const send = (method: string, path: string, cookie?: string, body?: unknown) =>
    fetch(path, {
      method,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  const ids = (fixture: IPoolStageFixture, ...names: string[]): string[] => names.map((name) => fixture.participationByName.get(name)!.id)
  const errorOf = async (response: Response): Promise<IApiError> => await response.json() as IApiError
  const preview = async (fixture: IPoolStageFixture): Promise<IRoundDrawPreview> => {
    const response = await send('GET', `/api/v1/admin/editions/${fixture.edition.id}/tirages/tour`, adminCookie)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    return await response.json() as IRoundDrawPreview
  }
  const openDraw = (fixture: IPoolStageFixture, body: unknown = {}) =>
    send('POST', `/api/v1/editions/${fixture.edition.id}/tirages/tour`, adminCookie, body)
  const assignments = (pairs: string[][]) => ({
    assignments: pairs.flatMap((pair, pairIndex) => pair.map((participationId, side) => ({
      participationId, pairingIndex: pairIndex + 1, sidePosition: side + 1, drawnOrder: pairIndex * 2 + side + 1
    })))
  })
  const roundsOf = (fixture: IPoolStageFixture) =>
    dataSource.getRepository(RoundEntity).findBy({ editionId: fixture.edition.id })

  it('answers 401 to an anonymous caller and 403 to a participant, before any data is read', async () => {
    const routes: Array<[string, string, unknown]> = [
      ['GET', `/api/v1/admin/editions/${semis.edition.id}/tirages/tour`, undefined],
      ['POST', `/api/v1/editions/${semis.edition.id}/tirages/tour`, {}]
    ]
    for (const [method, path, body] of routes) {
      expect((await send(method, path, undefined, body)).status, path).toBe(401)
      expect((await send(method, path, participantCookie, body)).status, path).toBe(403)
    }
  })

  it('refuses with 409 QUALIFICATION_NOT_DONE before the list is finalized, and the preview says why', async () => {
    expect(await preview(notFinalized)).toMatchObject({ roundKind: null, allowedRoundKinds: [], blockedBy: API_ERROR_CODE.QUALIFICATION_NOT_DONE })
    const response = await openDraw(notFinalized)
    expect(response.status).toBe(409)
    expect((await errorOf(response)).code).toBe(API_ERROR_CODE.QUALIFICATION_NOT_DONE)
  })

  it('rejects a malformed body and an unknown round with 400 VALIDATION_FAILED', async () => {
    for (const body of [{ roundKind: 'NOPE' }, { extra: true }]) {
      const response = await openDraw(semis, body)
      expect(response.status).toBe(400)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
    }
  })

  describe('four qualified players: the round is deduced', () => {
    let draw: IAdminDraw

    it('previews SEMI with the four qualified players, and creates no round before the draw', async () => {
      const state = await preview(semis)
      expect(state).toMatchObject({ roundKind: ROUND_KIND.SEMI, allowedRoundKinds: [ROUND_KIND.SEMI], blockedBy: null })
      expect(state.candidates).toHaveLength(4)
      const response = await openDraw(semis)
      expect(response.status).toBe(201)
      draw = await response.json() as IAdminDraw
      expect(draw).toMatchObject({ kind: DRAW_KIND.ROUND, roundKind: ROUND_KIND.SEMI, status: DRAW_STATUS.DRAFT })
      expect((await roundsOf(semis)).map((round) => round.kind)).toEqual([ROUND_KIND.POOLS])
    })

    it('refuses a requested round that is not the deduced one with 409', async () => {
      const response = await openDraw(semis, { roundKind: ROUND_KIND.QUARTER })
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.DRAW_INCONSISTENT)
    })

    it('a second POST replaces the draft instead of adding one', async () => {
      const again = await (await openDraw(semis)).json() as IAdminDraw
      expect(again.id).not.toBe(draw.id)
      draw = again
      const listed = await (await send('GET', `/api/v1/admin/editions/${semis.edition.id}/tirages`, adminCookie)).json() as IAdminDraw[]
      expect(listed.filter((candidate) => candidate.kind === DRAW_KIND.ROUND).map((candidate) => candidate.id)).toEqual([draw.id])
    })

    it('refuses to validate an incomplete draw with 409 DRAW_INCOMPLETE, and a pool-shaped body with 400', async () => {
      const [a1, d1, , d2] = ids(semis, 'c1', 'd1', 'c2', 'd2')
      const partial = await send('PUT', `/api/v1/tirages/${draw.id}/affectations`, adminCookie, assignments([[a1!, d1!]]))
      expect(partial.status).toBe(200)
      const incomplete = await send('POST', `/api/v1/tirages/${draw.id}/validation`, adminCookie)
      expect(incomplete.status).toBe(409)
      expect((await errorOf(incomplete)).code).toBe(API_ERROR_CODE.DRAW_INCOMPLETE)
      const poolShaped = await send('PUT', `/api/v1/tirages/${draw.id}/affectations`, adminCookie, {
        assignments: [{ participationId: d2, poolNumber: 1, drawnOrder: 1 }]
      })
      expect(poolShaped.status).toBe(400)
    })

    it('validates: the round is created DRAWN with its matches, the edition goes to PLAYOFFS; a second validation adds no match', async () => {
      const [c1, c2, d1, d2] = ids(semis, 'c1', 'c2', 'd1', 'd2')
      expect((await send('PUT', `/api/v1/tirages/${draw.id}/affectations`, adminCookie, assignments([[c1!, d2!], [d1!, c2!]]))).status).toBe(200)
      const validated = await send('POST', `/api/v1/tirages/${draw.id}/validation`, adminCookie)
      expect(validated.status).toBe(200)
      expect(await validated.json()).toMatchObject({ status: DRAW_STATUS.VALIDATED, roundKind: ROUND_KIND.SEMI })

      const round = (await roundsOf(semis)).find((candidate) => candidate.kind === ROUND_KIND.SEMI)!
      expect(round.status).toBe(ROUND_STATUS.DRAWN)
      const matches = await dataSource.getRepository(MatchEntity).findBy({ roundId: round.id })
      expect(matches).toHaveLength(2)
      expect(matches.every((match) => match.purpose === MATCH_PURPOSE.REGULAR && match.targetScore === 10)).toBe(true)
      expect((await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: semis.edition.id })).status).toBe(EDITION_STATUS.PLAYOFFS)

      const replay = await send('POST', `/api/v1/tirages/${draw.id}/validation`, adminCookie)
      expect(replay.status).toBe(200)
      expect(await dataSource.getRepository(MatchEntity).countBy({ roundId: round.id })).toBe(2)
      expect(await dataSource.getRepository(RoundEntity).countBy({ editionId: semis.edition.id, kind: ROUND_KIND.SEMI })).toBe(1)
    })

    it('refuses with 409 after the validation: the draft cannot be edited, and a POST answers DRAW_ALREADY_VALIDATED while the preview says ROUND_NOT_COMPLETED', async () => {
      const edit = await send('PUT', `/api/v1/tirages/${draw.id}/affectations`, adminCookie, assignments([]))
      expect(edit.status).toBe(409)
      expect((await errorOf(edit)).code).toBe(API_ERROR_CODE.DRAW_ALREADY_VALIDATED)
      expect(await preview(semis)).toMatchObject({ roundKind: null, blockedBy: API_ERROR_CODE.ROUND_NOT_COMPLETED })
      const next = await openDraw(semis)
      expect(next.status).toBe(409)
      expect((await errorOf(next)).code).toBe(API_ERROR_CODE.DRAW_ALREADY_VALIDATED)
    })
  })

  describe('playoffs (2024): the pool winners wait in the pool, they are not drawn', () => {
    it('previews PLAYOFF with the pool winners among the candidates, and refuses a pool winner in a pairing', async () => {
      const state = await preview(playoff)
      expect(state).toMatchObject({ roundKind: ROUND_KIND.PLAYOFF, allowedRoundKinds: [ROUND_KIND.PLAYOFF] })
      expect(state.candidates.map((member) => member.participationId).sort()).toEqual(ids(playoff, 'e1', 'e2', 'f1', 'f2').sort())
      const draw = await (await openDraw(playoff)).json() as IAdminDraw
      const [e1, e2, , f2] = ids(playoff, 'e1', 'e2', 'f1', 'f2')
      const winner = await send('PUT', `/api/v1/tirages/${draw.id}/affectations`, adminCookie, assignments([[e1!, f2!]]))
      expect(winner.status).toBe(409)
      expect((await errorOf(winner)).code).toBe(API_ERROR_CODE.DRAW_INCONSISTENT)

      expect((await send('PUT', `/api/v1/tirages/${draw.id}/affectations`, adminCookie, assignments([[e2!, f2!]]))).status).toBe(200)
      expect((await send('POST', `/api/v1/tirages/${draw.id}/validation`, adminCookie)).status).toBe(200)
      const round = (await roundsOf(playoff)).find((candidate) => candidate.kind === ROUND_KIND.PLAYOFF)!
      expect(round.status).toBe(ROUND_STATUS.DRAWN)
      expect(await dataSource.getRepository(MatchEntity).countBy({ roundId: round.id })).toBe(1)
    })
  })

  describe('six qualified players: the admin chooses the round (decisions 673e5b4b, 918dc05e)', () => {
    it('lists the allowed rounds and requires roundKind with 400', async () => {
      const state = await preview(chosen)
      expect(state.roundKind).toBeNull()
      expect(state.allowedRoundKinds).toEqual([ROUND_KIND.PLAYOFF, ROUND_KIND.QUARTER, ROUND_KIND.SEMI])
      const response = await openDraw(chosen)
      expect(response.status).toBe(400)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
    })

    it('refuses a round outside allowedRoundKinds with 409', async () => {
      for (const roundKind of [ROUND_KIND.ROUND_OF_16, ROUND_KIND.FINAL, ROUND_KIND.POOLS]) {
        const response = await openDraw(chosen, { roundKind })
        expect(response.status, roundKind).toBe(409)
        expect((await errorOf(response)).code).toBe(API_ERROR_CODE.DRAW_INCONSISTENT)
      }
    })

    it('changing the round with a new POST replaces the draft, then the validation locks it (409)', async () => {
      const first = await (await openDraw(chosen, { roundKind: ROUND_KIND.QUARTER })).json() as IAdminDraw
      expect(first.roundKind).toBe(ROUND_KIND.QUARTER)
      const second = await (await openDraw(chosen, { roundKind: ROUND_KIND.SEMI })).json() as IAdminDraw
      expect(second).toMatchObject({ roundKind: ROUND_KIND.SEMI, status: DRAW_STATUS.DRAFT })
      const listed = await (await send('GET', `/api/v1/admin/editions/${chosen.edition.id}/tirages`, adminCookie)).json() as IAdminDraw[]
      expect(listed.filter((candidate) => candidate.kind === DRAW_KIND.ROUND).map((candidate) => candidate.id)).toEqual([second.id])

      const [g1, g2, h1, h2, i1, i2] = ids(chosen, 'g1', 'g2', 'h1', 'h2', 'i1', 'i2')
      expect((await send('PUT', `/api/v1/tirages/${second.id}/affectations`, adminCookie, assignments([[g1!, h2!], [h1!, i2!], [i1!, g2!]]))).status).toBe(200)
      expect((await send('POST', `/api/v1/tirages/${second.id}/validation`, adminCookie)).status).toBe(200)
      expect((await roundsOf(chosen)).find((round) => round.kind === ROUND_KIND.SEMI)!.status).toBe(ROUND_STATUS.DRAWN)
      const locked = await send('PUT', `/api/v1/tirages/${second.id}/affectations`, adminCookie, assignments([]))
      expect(locked.status).toBe(409)
      const again = await openDraw(chosen, { roundKind: ROUND_KIND.QUARTER })
      expect(again.status).toBe(409)
    })
  })
})
