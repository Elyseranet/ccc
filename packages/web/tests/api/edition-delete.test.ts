import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../src/enums/match.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IApiError } from '../../src/interfaces/error.interface'
import type { IRankingRow } from '../../src/interfaces/ranking.interface'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { DrawAssignmentEntity } from '../../src/server/db/typeorm/entities/draw-assignment.entity'
import { DrawEntity } from '../../src/server/db/typeorm/entities/draw.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { InvitationEntity } from '../../src/server/db/typeorm/entities/invitation.entity'
import { MatchSideEntity } from '../../src/server/db/typeorm/entities/match-side.entity'
import { MatchEntity } from '../../src/server/db/typeorm/entities/match.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { PoolEntity } from '../../src/server/db/typeorm/entities/pool.entity'
import { RoundEntity } from '../../src/server/db/typeorm/entities/round.entity'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'

describe('DELETE /api/v1/editions/{id} (B-28)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource = await resetTestDatabase()
  await seedUser(dataSource, { email: 'boss-b28@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  await seedUser(dataSource, { email: 'player-b28@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  const count = (entity: new () => object, where: object) => dataSource.getRepository(entity).countBy(where)

  /** Édition complète : deux participants (le premier a un compte et une invitation), poule, tirage, affectations, tour, match et côtés. */
  const seedEdition = async (code: string, rank: number, status: EDITION_STATUS, origin: EDITION_ORIGIN, points: number | null) => {
    const edition = await dataSource.getRepository(EditionEntity).save({ code, year: 2100 + rank, chronologicalRank: rank, status, origin })
    const competitors = await dataSource.getRepository(CompetitorEntity).save(
      [`${code}-a`, `${code}-b`].map((displayName) => ({ displayName })))
    const user = await dataSource.getRepository(UserEntity).save({
      email: `${code}@ccc.test`, passwordHash: null, role: USER_ROLE.PARTICIPANT, competitorId: competitors[0]!.id
    })
    const invitation = await dataSource.getRepository(InvitationEntity).save({
      userId: user.id, tokenHash: code.padEnd(64, '0'), expiresAt: new Date(Date.now() + 86_400_000)
    })
    const pool = await dataSource.getRepository(PoolEntity).save({ editionId: edition.id, rank: 1 })
    const participations = await dataSource.getRepository(ParticipationEntity).save(competitors.map((competitor) => ({
      editionId: edition.id, competitorId: competitor.id, poolId: pool.id, points
    })))
    const draw = await dataSource.getRepository(DrawEntity).save({
      editionId: edition.id, kind: DRAW_KIND.POOLS, status: DRAW_STATUS.VALIDATED, parameters: { poolCount: 1, seedCount: 0 }
    })
    await dataSource.getRepository(DrawAssignmentEntity).save(participations.map((participation, index) => ({
      drawId: draw.id, participationId: participation.id, poolId: pool.id, drawnOrder: index + 1
    })))
    const round = await dataSource.getRepository(RoundEntity).save({ editionId: edition.id, kind: ROUND_KIND.POOLS, sequence: 0, status: ROUND_STATUS.COMPLETED })
    const match = await dataSource.getRepository(MatchEntity).save({
      editionId: edition.id, roundId: round.id, poolId: pool.id, sequence: 1, targetScore: 10, purpose: MATCH_PURPOSE.REGULAR,
      status: MATCH_STATUS.VALIDATED, validatedAt: new Date()
    })
    await dataSource.getRepository(MatchSideEntity).save(participations.map((participation, index) => ({
      matchId: match.id, position: index + 1, participationId: participation.id, validatedScore: 10 - index * 4, recordedScore: 10 - index * 4
    })))
    return { edition, competitors, user, invitation }
  }
  const running = await seedEdition('2091', 31, EDITION_STATUS.POOLS_PLAYING, EDITION_ORIGIN.APP, null)
  const closed = await seedEdition('2092', 32, EDITION_STATUS.CLOSED, EDITION_ORIGIN.APP, 50)
  const legacy = await seedEdition('2093', 33, EDITION_STATUS.CLOSED, EDITION_ORIGIN.LEGACY_IMPORT, 40)

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000' }
  })

  let adminCookie = ''
  let participantCookie = ''
  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login('boss-b28@ccc.test', PASSWORD))
    participantCookie = cookieHeaderOf(await login('player-b28@ccc.test', PASSWORD))
  })
  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const remove = (id: string, cookie = adminCookie) => fetch(`/api/v1/editions/${id}`, { method: 'DELETE', headers: cookie ? { Cookie: cookie } : {} })
  const pointsOf = async (competitorId: string) =>
    (await (await fetch('/api/v1/classements/all-time')).json() as IRankingRow[]).find((row) => row.competitor.id === competitorId)?.points

  it('answers 401 to an anonymous caller and 403 to a participant, and deletes nothing', async () => {
    expect((await remove(running.edition.id, '')).status).toBe(401)
    expect((await remove(running.edition.id, participantCookie)).status).toBe(403)
    expect(await count(EditionEntity, { id: running.edition.id })).toBe(1)
  })

  it('answers 404 for an unknown edition', async () => {
    expect((await remove('00000000-0000-4000-8000-000000000000')).status).toBe(404)
  })

  it('refuses an imported archive with 409 EDITION_LEGACY_PROTECTED and changes nothing', async () => {
    const response = await remove(legacy.edition.id)
    expect(response.status).toBe(409)
    expect((await response.json() as IApiError).code).toBe(API_ERROR_CODE.EDITION_LEGACY_PROTECTED)
    expect(await count(ParticipationEntity, { editionId: legacy.edition.id })).toBe(2)
    expect(await count(MatchEntity, { editionId: legacy.edition.id })).toBe(1)
  })

  it('deletes a running edition completely and keeps competitors, accounts and invitations', async () => {
    const response = await remove(running.edition.id)
    expect(response.status).toBe(204)
    for (const entity of [ParticipationEntity, PoolEntity, DrawEntity, RoundEntity, MatchEntity]) {
      expect(await count(entity, { editionId: running.edition.id })).toBe(0)
    }
    expect(await count(EditionEntity, { id: running.edition.id })).toBe(0)
    // Il reste les affectations et côtés des deux autres éditions (2 chacune) : ceux de l'édition supprimée sont partis.
    expect(await dataSource.getRepository(DrawAssignmentEntity).count()).toBe(4)
    expect(await dataSource.getRepository(MatchSideEntity).count()).toBe(4)
    expect(await count(CompetitorEntity, { id: running.competitors[0]!.id })).toBe(1)
    expect(await count(UserEntity, { id: running.user.id })).toBe(1)
    expect(await count(InvitationEntity, { id: running.invitation.id })).toBe(1)
    expect((await fetch(`/api/v1/editions/${running.edition.id}`)).status).toBe(404)
  })

  it('deletes a closed edition and its points leave the rankings', async () => {
    expect(await pointsOf(closed.competitors[0]!.id)).toBe(50)
    expect((await remove(closed.edition.id)).status).toBe(204)
    expect(await count(EditionEntity, { id: closed.edition.id })).toBe(0)
    expect(await pointsOf(closed.competitors[0]!.id)).toBeUndefined()
    expect(await pointsOf(legacy.competitors[0]!.id)).toBe(40)
    expect((await remove(closed.edition.id)).status).toBe(404)
  })

  it('keeps the profiles so they can be registered again in a new edition', async () => {
    expect(await count(CompetitorEntity, { id: closed.competitors[1]!.id })).toBe(1)
    const headers = { 'Content-Type': 'application/json', Cookie: adminCookie }
    const created = await fetch('/api/v1/editions', { method: 'POST', headers, body: JSON.stringify({ year: 2094, name: 'Redo' }) })
    expect(created.status).toBe(201)
    const { id } = await created.json() as { id: string }
    const added = await fetch(`/api/v1/editions/${id}/participants`, {
      method: 'POST', headers, body: JSON.stringify({ competitorId: closed.competitors[1]!.id })
    })
    expect(added.status).toBe(201)
    expect(await count(CompetitorEntity, { displayName: closed.competitors[1]!.displayName })).toBe(1)
  })
})
