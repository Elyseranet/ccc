import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../src/enums/match.enum'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../../src/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IEditionDetail } from '../../src/interfaces/edition.interface'
import type { IApiError } from '../../src/interfaces/error.interface'
import type { IRankingRow } from '../../src/interfaces/ranking.interface'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { MatchSideEntity } from '../../src/server/db/typeorm/entities/match-side.entity'
import { MatchEntity } from '../../src/server/db/typeorm/entities/match.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { RoundEntity } from '../../src/server/db/typeorm/entities/round.entity'
import { computeClosingPreview } from '../../src/utils/edition-closing.util'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const PLAYERS = 36

describe('edition closing and frozen points (B-14)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource = await resetTestDatabase()
  await seedUser(dataSource, { email: 'boss-b14@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  await seedUser(dataSource, { email: 'player-b14@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  /** Un tour de phase finale : [vainqueur, perdant] par match (indices de joueurs, 1 à 36). */
  interface IRoundPlan { kind: ROUND_KIND, matches: Array<readonly [number, number]>, validated?: boolean }
  const STANDARD_PLAN: IRoundPlan[] = [
    { kind: ROUND_KIND.QUARTER, matches: [[1, 5], [2, 6], [3, 7], [4, 8]] },
    { kind: ROUND_KIND.SEMI, matches: [[1, 3], [2, 4]] }
  ]

  /**
   * Une édition de 36 joueurs, SANS poule (aucun `poolId`, comme les éditions d'archives sans poule) : le stade se déduit des
   * seuls matchs de phase finale. `withTiebreak` ajoute un départage à 3 côtés (3-1-0) dans le tour de poules.
   */
  const seedEdition = async (code: string, rank: number, plan: IRoundPlan[], finalValidated: boolean, withTiebreak = false) => {
    const edition = await dataSource.getRepository(EditionEntity).save({
      code, year: 2100 + rank, chronologicalRank: rank, status: EDITION_STATUS.PLAYOFFS, origin: EDITION_ORIGIN.APP
    })
    const competitors = await dataSource.getRepository(CompetitorEntity).save(
      Array.from({ length: PLAYERS }, (_unused, index) => ({ displayName: `${code}-p${index + 1}` })))
    const participations = await dataSource.getRepository(ParticipationEntity).save(competitors.map((competitor, index) => ({
      editionId: edition.id, competitorId: competitor.id,
      status: index < 12 ? PARTICIPATION_STATUS.QUALIFIED : PARTICIPATION_STATUS.ELIMINATED,
      finalStage: index < 12 ? null : FINAL_STAGE.POOL_ELIMINATED
    })))
    const p = (n: number) => participations[n - 1]!.id
    let sequence = 0
    const save = async (round: RoundEntity, players: number[], scores: Array<number | null>, purpose: MATCH_PURPOSE, targetScore: number) => {
      sequence += 1
      const validated = scores[0] !== null
      const match = await dataSource.getRepository(MatchEntity).save({
        editionId: edition.id, roundId: round.id, sequence, targetScore, purpose,
        status: validated ? MATCH_STATUS.VALIDATED : MATCH_STATUS.SCHEDULED, validatedAt: validated ? new Date() : null
      })
      await dataSource.getRepository(MatchSideEntity).save(players.map((player, index) => ({
        matchId: match.id, position: index + 1, participationId: p(player), validatedScore: scores[index], recordedScore: scores[index]
      })))
    }
    const round = (kind: ROUND_KIND, sequenceNumber: number, status = ROUND_STATUS.COMPLETED) =>
      dataSource.getRepository(RoundEntity).save({ editionId: edition.id, kind, sequence: sequenceNumber, status })
    if (withTiebreak) {
      await save(await round(ROUND_KIND.POOLS, 0), [20, 21, 22], [3, 1, 0], MATCH_PURPOSE.TIEBREAK, 3)
    }
    for (const [index, step] of [...plan, { kind: ROUND_KIND.FINAL, matches: [[1, 2]] as const, validated: finalValidated }].entries()) {
      const stored = await round(step.kind, index + 1, step.validated === false ? ROUND_STATUS.DRAWN : ROUND_STATUS.COMPLETED)
      for (const [winner, loser] of step.matches) {
        await save(stored, [winner, loser], step.validated === false ? [null, null] : [10, 4], MATCH_PURPOSE.REGULAR, 10)
      }
    }
    return { edition, participations }
  }
  const ready = await seedEdition('2081', 21, STANDARD_PLAN, true)
  const notReady = await seedEdition('2082', 22, STANDARD_PLAN, false)
  // Barrages : p9 et p11 gagnent le leur et jouent un quart contre des premiers de poule exemptés (p1, p2) ; p10 et p12 perdent.
  const playoff = await seedEdition('2083', 23, [
    { kind: ROUND_KIND.PLAYOFF, matches: [[9, 10], [11, 12]] },
    { kind: ROUND_KIND.QUARTER, matches: [[1, 9], [2, 11], [3, 7], [4, 8]] },
    STANDARD_PLAN[1]!
  ], true)
  const tiebreak = await seedEdition('2084', 24, STANDARD_PLAN, true, true)

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000' }
  })

  let adminCookie = ''
  let participantCookie = ''
  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login('boss-b14@ccc.test', PASSWORD))
    participantCookie = cookieHeaderOf(await login('player-b14@ccc.test', PASSWORD))
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
  const close = (editionId: string, cookie = adminCookie) => send('POST', `/api/v1/editions/${editionId}/cloture`, cookie)
  const pointsOf = (detail: IEditionDetail, index: number) =>
    detail.participants.find((participant) => participant.participationId === ready.participations[index - 1]!.id)!

  it('answers 401 to an anonymous caller and 403 to a participant', async () => {
    expect((await close(ready.edition.id, '')).status).toBe(401)
    expect((await close(ready.edition.id, participantCookie)).status).toBe(403)
  })

  it('answers 404 for an unknown edition', async () => {
    const response = await close('00000000-0000-4000-8000-000000000000')
    expect(response.status).toBe(404)
  })

  it('refuses with 409 FINAL_NOT_VALIDATED before the final is validated, and changes nothing', async () => {
    const response = await close(notReady.edition.id)
    expect(response.status).toBe(409)
    expect((await response.json() as IApiError).code).toBe(API_ERROR_CODE.FINAL_NOT_VALIDATED)
    expect((await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: notReady.edition.id })).status).toBe(EDITION_STATUS.PLAYOFFS)
    expect((await dataSource.getRepository(ParticipationEntity).findBy({ editionId: notReady.edition.id })).every((participation) => participation.points === null)).toBe(true)
  })

  /** L'aperçu calculé sur la forme publique, avant la clôture, doit être exactement ce que le serveur fige. */
  const expectFreezeEqualsPreview = async (editionId: string) => {
    const before = await (await send('GET', `/api/v1/editions/${editionId}`)).json() as IEditionDetail
    const preview = computeClosingPreview(before)
    expect(preview).toMatchObject({ participantCount: PLAYERS, blockedBy: null })
    expect((await close(editionId)).status).toBe(200)
    const after = await (await send('GET', `/api/v1/editions/${editionId}`)).json() as IEditionDetail
    const byId = (rows: Array<{ participationId: string }>) => [...rows].sort((a, b) => a.participationId.localeCompare(b.participationId))
    expect(byId(after.participants.map(({ participationId, finalStage, points }) => ({ participationId, finalStage, points }))))
      .toEqual(byId(preview.results))
    return after
  }

  it('the preview computed in the browser shape equals what the server freezes', async () => {
    await expectFreezeEqualsPreview(ready.edition.id)
  })

  it('with playoffs: the losers of the playoffs are PLAYOFF (0.72), the pool winners exempted from them are not', async () => {
    const detail = await expectFreezeEqualsPreview(playoff.edition.id)
    const of = (n: number) => detail.participants.find((participant) => participant.participationId === playoff.participations[n - 1]!.id)!
    expect(of(10)).toMatchObject({ finalStage: FINAL_STAGE.PLAYOFF, points: 0.72 })
    expect(of(12)).toMatchObject({ finalStage: FINAL_STAGE.PLAYOFF, points: 0.72 })
    expect(of(9)).toMatchObject({ finalStage: FINAL_STAGE.QUARTER, points: 4.32 })
    for (const exempt of [3, 4, 7, 8]) {
      expect(of(exempt).finalStage, `p${exempt}`).not.toBe(FINAL_STAGE.PLAYOFF)
    }
    expect(of(7)).toMatchObject({ finalStage: FINAL_STAGE.QUARTER })
  })

  it('a 3-sided tiebreak in the pool round is ignored by the stage deduction, preview and freeze alike', async () => {
    const detail = await expectFreezeEqualsPreview(tiebreak.edition.id)
    for (const n of [20, 21, 22]) {
      expect(detail.participants.find((participant) => participant.participationId === tiebreak.participations[n - 1]!.id))
        .toMatchObject({ finalStage: FINAL_STAGE.POOL_ELIMINATED, points: 0 })
    }
    expect(detail.participants.find((participant) => participant.participationId === tiebreak.participations[0]!.id)).toMatchObject({ finalStage: FINAL_STAGE.CHAMPION, points: 12.96 })
  })

  it('froze 12.96 for the champion of 36, the other stages, N and the closing date', async () => {
    const detail = await (await send('GET', `/api/v1/editions/${ready.edition.id}`)).json() as IEditionDetail
    expect(pointsOf(detail, 1)).toMatchObject({ finalStage: FINAL_STAGE.CHAMPION, points: 12.96 })
    expect(pointsOf(detail, 2)).toMatchObject({ finalStage: FINAL_STAGE.FINALIST, points: 9.36 })
    expect(pointsOf(detail, 3)).toMatchObject({ finalStage: FINAL_STAGE.SEMI, points: 6.48 })
    expect(pointsOf(detail, 5)).toMatchObject({ finalStage: FINAL_STAGE.QUARTER, points: 4.32 })
    expect(pointsOf(detail, 20)).toMatchObject({ finalStage: FINAL_STAGE.POOL_ELIMINATED, points: 0 })
    // Comme les archives : WINNER pour le champion, ELIMINATED pour tous les autres, quel que soit leur stade.
    expect(pointsOf(detail, 1).status).toBe(PARTICIPATION_STATUS.WINNER)
    expect(detail.participants.filter((participant) => participant.status === PARTICIPATION_STATUS.WINNER)).toHaveLength(1)
    expect(detail.participants.filter((participant) => participant.status === PARTICIPATION_STATUS.ELIMINATED)).toHaveLength(PLAYERS - 1)
    const stored = await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: ready.edition.id })
    expect(stored).toMatchObject({ status: EDITION_STATUS.CLOSED, participantCount: PLAYERS })
    expect(stored.closedAt).toBeInstanceOf(Date)
  })

  it('is idempotent: a second closing answers 200 with the same state and recomputes nothing', async () => {
    const stored = await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: ready.edition.id })
    const again = await close(ready.edition.id)
    expect(again.status).toBe(200)
    expect(again.headers.get('cache-control')).toBe('no-store')
    const replayed = await again.json() as IEditionDetail
    expect(pointsOf(replayed, 1)).toMatchObject({ points: 12.96, status: PARTICIPATION_STATUS.WINNER })
    expect(replayed.participants.filter((participant) => participant.status === PARTICIPATION_STATUS.ELIMINATED)).toHaveLength(PLAYERS - 1)
    expect(replayed.participants.some((participant) => [PARTICIPATION_STATUS.QUALIFIED, PARTICIPATION_STATUS.IN_POOL].includes(participant.status))).toBe(false)
    expect((await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: ready.edition.id })).closedAt!.toISOString()).toBe(stored.closedAt!.toISOString())
  })

  it('GET /classements/acp now counts the closed edition', async () => {
    const rows = await (await send('GET', '/api/v1/classements/acp')).json() as IRankingRow[]
    const champion = rows.find((row) => row.competitor.id === ready.participations[0]!.competitorId)
    expect(champion).toMatchObject({ points: 12.96, titles: 1 })
  })

  it('refuses every write on the closed edition with 409 EDITION_CLOSED', async () => {
    const writes: Array<[string, string, unknown]> = [
      ['PATCH', `/api/v1/editions/${ready.edition.id}`, { name: 'Renamed' }],
      ['POST', `/api/v1/editions/${ready.edition.id}/qualification`, { topPerPool: 1, bestNextCount: 0, withPlayoff: false }],
      ['POST', `/api/v1/editions/${ready.edition.id}/tirages/tour`, {}]
    ]
    for (const [method, path, body] of writes) {
      const response = await send(method, path, adminCookie, body)
      expect(response.status, path).toBe(409)
      expect((await response.json() as IApiError).code, path).toBe(API_ERROR_CODE.EDITION_CLOSED)
    }
  })
})
