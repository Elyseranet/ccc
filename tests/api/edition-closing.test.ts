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

  /** Une édition de 36 joueurs en phase finale : quarts, demies, finale (validée ou non). Les 28 autres sont éliminés en poule. */
  const seedEdition = async (code: string, rank: number, finalValidated: boolean) => {
    const edition = await dataSource.getRepository(EditionEntity).save({
      code, year: 2100 + rank, chronologicalRank: rank, status: EDITION_STATUS.PLAYOFFS, origin: EDITION_ORIGIN.APP
    })
    const competitors = await dataSource.getRepository(CompetitorEntity).save(
      Array.from({ length: PLAYERS }, (_unused, index) => ({ displayName: `${code}-p${index + 1}` })))
    const participations = await dataSource.getRepository(ParticipationEntity).save(competitors.map((competitor, index) => ({
      editionId: edition.id, competitorId: competitor.id,
      status: index < 8 ? PARTICIPATION_STATUS.QUALIFIED : PARTICIPATION_STATUS.ELIMINATED,
      finalStage: index < 8 ? null : FINAL_STAGE.POOL_ELIMINATED
    })))
    const p = (n: number) => participations[n - 1]!.id
    let sequence = 0
    const play = async (kind: ROUND_KIND, round: RoundEntity, winner: number, loser: number, validated = true) => {
      sequence += 1
      const match = await dataSource.getRepository(MatchEntity).save({
        editionId: edition.id, roundId: round.id, sequence, targetScore: 10, purpose: MATCH_PURPOSE.REGULAR,
        status: validated ? MATCH_STATUS.VALIDATED : MATCH_STATUS.SCHEDULED, validatedAt: validated ? new Date() : null
      })
      await dataSource.getRepository(MatchSideEntity).save([
        { matchId: match.id, position: 1, participationId: p(winner), validatedScore: validated ? 10 : null, recordedScore: validated ? 10 : null },
        { matchId: match.id, position: 2, participationId: p(loser), validatedScore: validated ? 4 : null, recordedScore: validated ? 4 : null }
      ])
      return kind
    }
    const round = (kind: ROUND_KIND, sequenceNumber: number, status = ROUND_STATUS.COMPLETED) =>
      dataSource.getRepository(RoundEntity).save({ editionId: edition.id, kind, sequence: sequenceNumber, status })
    const quarter = await round(ROUND_KIND.QUARTER, 1)
    for (const [winner, loser] of [[1, 5], [2, 6], [3, 7], [4, 8]] as const) await play(ROUND_KIND.QUARTER, quarter, winner, loser)
    const semi = await round(ROUND_KIND.SEMI, 2)
    await play(ROUND_KIND.SEMI, semi, 1, 3)
    await play(ROUND_KIND.SEMI, semi, 2, 4)
    const final = await round(ROUND_KIND.FINAL, 3, finalValidated ? ROUND_STATUS.COMPLETED : ROUND_STATUS.DRAWN)
    await play(ROUND_KIND.FINAL, final, 1, 2, finalValidated)
    return { edition, participations }
  }
  const ready = await seedEdition('2081', 21, true)
  const notReady = await seedEdition('2082', 22, false)

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

  it('the preview computed in the browser shape equals what the server freezes', async () => {
    const before = await (await send('GET', `/api/v1/editions/${ready.edition.id}`)).json() as IEditionDetail
    const preview = computeClosingPreview(before)
    expect(preview).toMatchObject({ participantCount: PLAYERS, blockedBy: null })

    expect((await close(ready.edition.id)).status).toBe(200)
    const after = await (await send('GET', `/api/v1/editions/${ready.edition.id}`)).json() as IEditionDetail
    expect(after.participants.map(({ participationId, finalStage, points }) => ({ participationId, finalStage, points }))
      .sort((a, b) => a.participationId.localeCompare(b.participationId)))
      .toEqual([...preview.results].sort((a, b) => a.participationId.localeCompare(b.participationId)))
  })

  it('froze 12.96 for the champion of 36, the other stages, N and the closing date', async () => {
    const detail = await (await send('GET', `/api/v1/editions/${ready.edition.id}`)).json() as IEditionDetail
    expect(pointsOf(detail, 1)).toMatchObject({ finalStage: FINAL_STAGE.CHAMPION, points: 12.96 })
    expect(pointsOf(detail, 2)).toMatchObject({ finalStage: FINAL_STAGE.FINALIST, points: 9.36 })
    expect(pointsOf(detail, 3)).toMatchObject({ finalStage: FINAL_STAGE.SEMI, points: 6.48 })
    expect(pointsOf(detail, 5)).toMatchObject({ finalStage: FINAL_STAGE.QUARTER, points: 4.32 })
    expect(pointsOf(detail, 20)).toMatchObject({ finalStage: FINAL_STAGE.POOL_ELIMINATED, points: 0 })
    const stored = await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: ready.edition.id })
    expect(stored).toMatchObject({ status: EDITION_STATUS.CLOSED, participantCount: PLAYERS })
    expect(stored.closedAt).toBeInstanceOf(Date)
  })

  it('is idempotent: a second closing answers 200 with the same state and recomputes nothing', async () => {
    const stored = await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: ready.edition.id })
    const again = await close(ready.edition.id)
    expect(again.status).toBe(200)
    expect(again.headers.get('cache-control')).toBe('no-store')
    expect(pointsOf(await again.json() as IEditionDetail, 1).points).toBe(12.96)
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
