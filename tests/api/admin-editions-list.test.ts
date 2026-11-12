import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IAdminEditionSummary, IEditionSummary } from '../../src/interfaces/edition.interface'
import type { IApiError } from '../../src/interfaces/error.interface'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const FROZEN_PARTICIPANT_COUNT = 16

describe('admin editions list with the live registered count (B-20)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()
  await seedUser(dataSource, { email: 'boss-b20@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  await seedUser(dataSource, { email: 'player-b20@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  const players = await dataSource.getRepository(CompetitorEntity).save(
    ['Ana', 'Bob', 'Cat', 'Dan', 'Eve'].map((displayName) => ({ displayName }))
  )
  const editionRepo = dataSource.getRepository(EditionEntity)
  const closed = await editionRepo.save({
    code: '2051', year: 2051, chronologicalRank: 1, status: EDITION_STATUS.CLOSED, origin: EDITION_ORIGIN.APP,
    participantCount: FROZEN_PARTICIPANT_COUNT, closedAt: new Date('2051-06-01T00:00:00Z')
  })
  const live = await editionRepo.save({
    code: '2052', year: 2052, chronologicalRank: 2, status: EDITION_STATUS.REGISTRATION, origin: EDITION_ORIGIN.APP
  })
  const empty = await editionRepo.save({
    code: '2053', year: 2053, chronologicalRank: 3, status: EDITION_STATUS.CREATED, origin: EDITION_ORIGIN.APP
  })
  const participationRepo = dataSource.getRepository(ParticipationEntity)
  await participationRepo.save([players[0]!, players[1]!].map((player) => ({ editionId: closed.id, competitorId: player.id })))
  await participationRepo.save([players[0]!, players[1]!, players[2]!].map((player) => ({ editionId: live.id, competitorId: player.id })))

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000' }
  })

  let adminCookie = ''
  let participantCookie = ''
  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login('boss-b20@ccc.test', PASSWORD))
    participantCookie = cookieHeaderOf(await login('player-b20@ccc.test', PASSWORD))
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
  const adminList = async (): Promise<IAdminEditionSummary[]> => {
    const response = await send('GET', '/api/v1/admin/editions', adminCookie)
    expect(response.status).toBe(200)
    return await response.json() as IAdminEditionSummary[]
  }
  const registeredOf = (list: IAdminEditionSummary[], code: string): number => list.find((edition) => edition.code === code)!.registeredCount

  it('answers 401 to an anonymous caller and 403 to a participant, without any edition data', async () => {
    const anonymous = await send('GET', '/api/v1/admin/editions')
    expect(anonymous.status).toBe(401)
    expect((await anonymous.json() as IApiError).code).toBe(API_ERROR_CODE.UNAUTHORIZED)
    const participant = await send('GET', '/api/v1/admin/editions', participantCookie)
    expect(participant.status).toBe(403)
    const text = await participant.text()
    expect(text).not.toContain('registeredCount')
    expect(text).not.toContain('2051')
  })

  it('lists every edition, most recent first, no-store, with the live registered count (0 without any registrant)', async () => {
    const response = await send('GET', '/api/v1/admin/editions', adminCookie)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const list = await response.json() as IAdminEditionSummary[]
    expect(list.map((edition) => edition.code)).toEqual(['2053', '2052', '2051'])
    expect(registeredOf(list, '2052')).toBe(3)
    expect(registeredOf(list, '2053')).toBe(0)
    expect(registeredOf(list, '2051')).toBe(2)
  })

  it('keeps the frozen participantCount of a closed edition, apart from the live count', async () => {
    const closedEdition = (await adminList()).find((edition) => edition.code === '2051')!
    expect(closedEdition.participantCount).toBe(FROZEN_PARTICIPANT_COUNT)
    expect(closedEdition.registeredCount).toBe(2)
    expect((await adminList()).find((edition) => edition.code === '2052')!.participantCount).toBeNull()
  })

  it('follows an addition and a withdrawal made through the admin routes', async () => {
    expect(registeredOf(await adminList(), '2052')).toBe(3)

    const added = await send('POST', `/api/v1/editions/${live.id}/participants`, adminCookie, { competitorId: players[3]!.id })
    expect(added.status).toBe(201)
    expect(registeredOf(await adminList(), '2052')).toBe(4)

    const participation = await participationRepo.findOneByOrFail({ editionId: live.id, competitorId: players[3]!.id })
    const removed = await send('DELETE', `/api/v1/editions/${live.id}/participants/${participation.id}`, adminCookie)
    expect(removed.status).toBe(204)
    expect(registeredOf(await adminList(), '2052')).toBe(3)
  })

  it('leaves the public list unchanged and without registeredCount', async () => {
    const publicResponse = await fetch('/api/v1/editions')
    expect(publicResponse.status).toBe(200)
    const text = await publicResponse.text()
    expect(text).not.toContain('registeredCount')
    const publicList = JSON.parse(text) as IEditionSummary[]
    const stripped = (await adminList()).map(({ registeredCount: _registeredCount, ...summary }) => summary)
    expect(publicList).toEqual(stripped)
  })
})
