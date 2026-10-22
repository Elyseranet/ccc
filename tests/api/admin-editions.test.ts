import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { ACCOUNT_STATE, USER_ROLE, USER_STATUS } from '../../src/enums/user.enum'
import type { ICompetitorPublic } from '../../src/interfaces/competitor.interface'
import type { IAdminParticipant, IEditionParticipant, IEditionSummary } from '../../src/interfaces/edition.interface'
import type { IApiError } from '../../src/interfaces/error.interface'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { DrawAssignmentEntity } from '../../src/server/db/typeorm/entities/draw-assignment.entity'
import { DrawEntity } from '../../src/server/db/typeorm/entities/draw.entity'
import { InvitationEntity } from '../../src/server/db/typeorm/entities/invitation.entity'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { createMailCapture } from './helpers/mail-capture'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const PRIVATE_PHONE = '+33 6 11 22 33 44'
const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000'

let dataSource: DataSource
let adminCookie: string
let participantCookie: string

const send = (method: string, path: string, body?: unknown, cookie?: string, extraHeaders: Record<string, string> = {}): Promise<Response> =>
  fetch(path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(cookie ? { Cookie: cookie } : {}),
      ...extraHeaders
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })

const asAdmin = (method: string, path: string, body?: unknown) => send(method, path, body, adminCookie)

const createEdition = async (year: number, name = `CCC ${year}`): Promise<IEditionSummary> => {
  const response = await asAdmin('POST', '/api/v1/editions', { year, name })
  expect(response.status).toBe(201)
  return await response.json() as IEditionSummary
}

const createCompetitor = (displayName: string): Promise<CompetitorEntity> =>
  dataSource.getRepository(CompetitorEntity).save({ displayName, phone: PRIVATE_PHONE })

const errorOf = async (response: Response): Promise<IApiError> => await response.json() as IApiError

describe('admin editions, identity and participants (B-10)', async () => {
  const env = requireTestDatabaseEnv()
  const mails = await createMailCapture()
  const capturedMails = mails.read
  dataSource = await resetTestDatabase()
  await seedUser(dataSource, { email: 'boss@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  await seedUser(dataSource, { email: 'player@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, ...mails.env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000' }
  })

  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login('boss@ccc.test', PASSWORD))
    participantCookie = cookieHeaderOf(await login('player@ccc.test', PASSWORD))
  })

  afterAll(async () => {
    await mails.dispose()
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  describe('authorization', () => {
    const routes: Array<[string, string, unknown]> = [
      ['POST', '/api/v1/editions', { year: 2030, name: 'x' }],
      ['PATCH', `/api/v1/editions/${UNKNOWN_UUID}`, { name: 'x' }],
      ['PATCH', `/api/v1/competiteurs/${UNKNOWN_UUID}`, { displayName: 'x' }],
      ['POST', `/api/v1/editions/${UNKNOWN_UUID}/participants`, { competitorId: UNKNOWN_UUID }],
      ['DELETE', `/api/v1/editions/${UNKNOWN_UUID}/participants/${UNKNOWN_UUID}`, undefined],
      ['GET', `/api/v1/admin/editions/${UNKNOWN_UUID}/participants`, undefined]
    ]

    it.each(routes)('%s %s answers 401 to an anonymous caller', async (method, path, body) => {
      const response = await send(method, path, body)
      expect(response.status).toBe(401)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.UNAUTHORIZED)
    })

    it.each(routes)('%s %s answers 403 to a participant', async (method, path, body) => {
      const response = await send(method, path, body, participantCookie)
      expect(response.status).toBe(403)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.FORBIDDEN)
    })
  })

  describe('POST /editions', () => {
    it('creates an APP edition with a computed code and rank', async () => {
      const response = await asAdmin('POST', '/api/v1/editions', {
        year: 2031, name: 'CCC 2031', heldOn: '2031-06-14', location: 'Lyon', description: 'Une édition'
      })
      expect(response.status).toBe(201)
      const body = await response.json() as IEditionSummary
      expect(body).toMatchObject({ code: '2031', year: 2031, name: 'CCC 2031', heldOn: '2031-06-14', location: 'Lyon', status: EDITION_STATUS.CREATED, origin: EDITION_ORIGIN.APP })
      const stored = await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: body.id })
      expect(stored.chronologicalRank).toBeGreaterThan(0)
    })

    it('gives two editions of the same year two distinct codes and ranks', async () => {
      const first = await createEdition(2032)
      const second = await createEdition(2032)
      expect(first.code).toBe('2032')
      expect(second.code).toBe('2032b')
      const [a, b] = await Promise.all([first, second].map((edition) => dataSource.getRepository(EditionEntity).findOneByOrFail({ id: edition.id })))
      expect(b!.chronologicalRank).toBe(a!.chronologicalRank + 1)
    })

    it('keeps codes and ranks unique under concurrent creations', async () => {
      const responses = await Promise.all(Array.from({ length: 5 }, () => asAdmin('POST', '/api/v1/editions', { year: 2033, name: 'parallel' })))
      expect(responses.map((response) => response.status)).toEqual([201, 201, 201, 201, 201])
      const created = await Promise.all(responses.map(async (response) => await response.json() as IEditionSummary))
      expect(new Set(created.map((edition) => edition.code)).size).toBe(5)
      const ranks = (await dataSource.getRepository(EditionEntity).find({ where: { year: 2033 } })).map((edition) => edition.chronologicalRank)
      expect(new Set(ranks).size).toBe(5)
    })

    it.each([
      ['an unknown field', { year: 2034, name: 'x', code: '2034z' }],
      ['a status', { year: 2034, name: 'x', status: EDITION_STATUS.CLOSED }],
      ['a missing name', { year: 2034 }],
      ['an out-of-range year', { year: 1500, name: 'x' }],
      ['an impossible date', { year: 2034, name: 'x', heldOn: '2034-02-30' }]
    ])('answers 400 for %s and creates nothing', async (_label, body) => {
      const response = await asAdmin('POST', '/api/v1/editions', body)
      expect(response.status).toBe(400)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
      expect(await dataSource.getRepository(EditionEntity).countBy({ year: 2034 })).toBe(0)
    })
  })

  describe('PATCH /editions/{id}', () => {
    it('updates the general information and keeps code, year, rank and status', async () => {
      const edition = await createEdition(2035)
      const before = await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: edition.id })
      const response = await asAdmin('PATCH', `/api/v1/editions/${edition.id}`, { name: 'Renommée', location: 'Paris', heldOn: '2035-05-01' })
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ name: 'Renommée', location: 'Paris', heldOn: '2035-05-01', code: '2035' })
      const after = await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: edition.id })
      expect([after.code, after.year, after.chronologicalRank, after.status]).toEqual([before.code, before.year, before.chronologicalRank, before.status])
    })

    it.each([
      ['code', '2999'],
      ['year', 2999],
      ['chronologicalRank', 999],
      ['status', EDITION_STATUS.CLOSED]
    ])('refuses %s with a 400 and leaves the stored edition unchanged (R-9)', async (field, value) => {
      const edition = await createEdition(2036, `CCC ${field}`)
      const response = await asAdmin('PATCH', `/api/v1/editions/${edition.id}`, { name: 'Autre', [field]: value })
      expect(response.status).toBe(400)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
      const stored = await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: edition.id })
      expect(stored.code).toBe(edition.code)
      expect(stored.year).toBe(edition.year)
      expect(stored.status).toBe(EDITION_STATUS.CREATED)
      expect(stored.name).toBe(edition.name)
    })

    it('is addressable by code', async () => {
      await createEdition(2037)
      expect((await asAdmin('PATCH', '/api/v1/editions/2037', { description: 'par code' })).status).toBe(200)
    })

    it('answers 409 EDITION_CLOSED for a closed edition', async () => {
      const edition = await createEdition(2038)
      await dataSource.getRepository(EditionEntity).update({ id: edition.id }, { status: EDITION_STATUS.CLOSED })
      const response = await asAdmin('PATCH', `/api/v1/editions/${edition.id}`, { name: 'trop tard' })
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.EDITION_CLOSED)
    })

    it('answers 404 for an unknown edition and 400 for an empty body', async () => {
      expect((await asAdmin('PATCH', `/api/v1/editions/${UNKNOWN_UUID}`, { name: 'x' })).status).toBe(404)
      const edition = await createEdition(2039)
      expect((await asAdmin('PATCH', `/api/v1/editions/${edition.id}`, {})).status).toBe(400)
    })

    it('invalidates the public ETag so a renamed edition is not served as 304', async () => {
      const edition = await createEdition(2040)
      const first = await fetch(`/api/v1/editions/${edition.id}`)
      const etag = first.headers.get('etag')!
      await asAdmin('PATCH', `/api/v1/editions/${edition.id}`, { name: 'Nouveau nom' })
      const second = await fetch(`/api/v1/editions/${edition.id}`, { headers: { 'If-None-Match': etag } })
      expect(second.status).toBe(200)
      expect((await second.json() as IEditionSummary).name).toBe('Nouveau nom')
    })
  })

  describe('PATCH /competiteurs/{id}', () => {
    it('corrects the identity and exposes no private field', async () => {
      const competitor = await createCompetitor('Rémy Duran')
      const response = await asAdmin('PATCH', `/api/v1/competiteurs/${competitor.id}`, { displayName: 'Rémi Durand', firstName: 'Rémi', nickname: null })
      expect(response.status).toBe(200)
      const body = await response.json() as ICompetitorPublic
      expect(body).toMatchObject({ id: competitor.id, displayName: 'Rémi Durand', firstName: 'Rémi', nickname: null })
      expect(JSON.stringify(body)).not.toContain('11 22')
      const stored = await dataSource.getRepository(CompetitorEntity).findOneByOrFail({ id: competitor.id })
      expect(stored.displayName).toBe('Rémi Durand')
      expect(stored.phone).toBe(PRIVATE_PHONE)
    })

    it.each([['avatarUrl', 'https://example.com/a.png'], ['phone', '+33 6 00'], ['email', 'a@b.fr']])('refuses %s with a 400', async (field, value) => {
      const competitor = await createCompetitor(`Strict ${field}`)
      const response = await asAdmin('PATCH', `/api/v1/competiteurs/${competitor.id}`, { displayName: 'x', [field]: value })
      expect(response.status).toBe(400)
    })

    it('answers 404 COMPETITOR_NOT_FOUND for an unknown competitor and 400 for a bad id', async () => {
      const missing = await asAdmin('PATCH', `/api/v1/competiteurs/${UNKNOWN_UUID}`, { displayName: 'x' })
      expect(missing.status).toBe(404)
      expect((await errorOf(missing)).code).toBe(API_ERROR_CODE.COMPETITOR_NOT_FOUND)
      expect((await asAdmin('PATCH', '/api/v1/competiteurs/not-a-uuid', { displayName: 'x' })).status).toBe(400)
    })
  })

  describe('participants', () => {
    it('attaches an existing competitor and moves the edition to REGISTRATION', async () => {
      const edition = await createEdition(2041)
      const competitor = await createCompetitor('Inscrit Un')
      const response = await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: competitor.id })
      expect(response.status).toBe(201)
      const body = await response.json() as IEditionParticipant
      expect(body.competitor).toMatchObject({ id: competitor.id, displayName: 'Inscrit Un' })
      expect(body).toMatchObject({ poolId: null, isSeed: false, seedRank: null, points: null })
      expect(JSON.stringify(body)).not.toContain('11 22')
      expect((await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: edition.id })).status).toBe(EDITION_STATUS.REGISTRATION)

      const listed = await (await fetch(`/api/v1/editions/${edition.id}/participants`)).json() as IEditionParticipant[]
      expect(listed.map((participant) => participant.competitor.id)).toEqual([competitor.id])
    })

    describe('{ newCompetitor }', () => {
      const newCompetitor = (email: string) => ({ email, firstName: 'Nina', lastName: 'Neuve', phone: '+33 6 99 88 77 66' })

      it('creates the competitor, the invited account, the invitation and the participation in one call', async () => {
        const edition = await createEdition(2050)
        const response = await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { newCompetitor: newCompetitor('Nina@CCC.test') })
        expect(response.status).toBe(201)
        const body = await response.json() as IEditionParticipant & { invitationSent: boolean | null }
        expect(body.competitor).toMatchObject({ displayName: 'Nina Neuve', firstName: 'Nina', lastName: 'Neuve' })
        // L'email part après le commit, par l'adaptateur de capture ; ni le jeton ni le lien ne sont dans la réponse.
        expect(body.invitationSent).toBe(true)
        expect(JSON.stringify(body)).not.toMatch(/token|invitation\/|99 88|nina@/i)
        const sent = (await capturedMails()).filter((mail) => mail.to === 'nina@ccc.test')
        expect(sent).toHaveLength(1)
        expect(sent[0]!.text).toMatch(/\/invitation\/[A-Za-z0-9_-]{43}/)
        const user = await dataSource.query('SELECT email, status FROM users WHERE competitor_id = $1', [body.competitor.id])
        expect(user).toEqual([{ email: 'nina@ccc.test', status: 'INVITED' }])
        expect(await dataSource.query('SELECT 1 FROM invitations i JOIN users u ON u.id = i.user_id WHERE u.competitor_id = $1', [body.competitor.id])).toHaveLength(1)
        expect((await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: edition.id })).status).toBe(EDITION_STATUS.REGISTRATION)
      })

      it('answers 409 EMAIL_ALREADY_USED and writes nothing', async () => {
        const edition = await createEdition(2051)
        const path = `/api/v1/editions/${edition.id}/participants`
        const competitorsBefore = await dataSource.getRepository(CompetitorEntity).count()
        const response = await asAdmin('POST', path, { newCompetitor: newCompetitor('player@ccc.test') })
        expect(response.status).toBe(409)
        expect((await errorOf(response)).code).toBe(API_ERROR_CODE.EMAIL_ALREADY_USED)
        expect(await dataSource.getRepository(CompetitorEntity).count()).toBe(competitorsBefore)
        expect(await dataSource.getRepository(ParticipationEntity).countBy({ editionId: edition.id })).toBe(0)
        expect((await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: edition.id })).status).toBe(EDITION_STATUS.CREATED)
        expect((await capturedMails()).filter((mail) => mail.to === 'player@ccc.test')).toHaveLength(0)
      })

      it('creates no competitor when the pools draw is validated', async () => {
        const edition = await createEdition(2052)
        await dataSource.getRepository(DrawEntity).save({
          editionId: edition.id, kind: DRAW_KIND.POOLS, status: DRAW_STATUS.VALIDATED, parameters: { poolCount: 2, seedCount: 2 }, validatedAt: new Date()
        })
        const response = await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { newCompetitor: newCompetitor('late@ccc.test') })
        expect(response.status).toBe(409)
        expect(await dataSource.query('SELECT 1 FROM users WHERE email = $1', ['late@ccc.test'])).toHaveLength(0)
        expect((await capturedMails()).filter((mail) => mail.to === 'late@ccc.test')).toHaveLength(0)
      })

      it.each([
        ['an avatar', { ...newCompetitor('av@ccc.test'), avatarUrl: 'https://example.com/a.png' }],
        ['a bad email', newCompetitor('not-an-email')],
        ['a missing last name', { email: 'x@ccc.test', firstName: 'X' }]
      ])('answers 400 for %s', async (_label, body) => {
        const edition = await createEdition(2053)
        const response = await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { newCompetitor: body })
        expect(response.status).toBe(400)
      })

      it('refuses a body that carries both forms', async () => {
        const edition = await createEdition(2054)
        const response = await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: UNKNOWN_UUID, newCompetitor: newCompetitor('both@ccc.test') })
        expect(response.status).toBe(400)
      })
    })

    it('answers 409 when the competitor is already registered, even under a race', async () => {
      const edition = await createEdition(2042)
      const competitor = await createCompetitor('Doublon')
      const path = `/api/v1/editions/${edition.id}/participants`
      const responses = await Promise.all([1, 2, 3].map(() => asAdmin('POST', path, { competitorId: competitor.id })))
      expect(responses.map((response) => response.status).sort()).toEqual([201, 409, 409])
      const conflict = responses.find((response) => response.status === 409)!
      expect((await errorOf(conflict)).code).toBe(API_ERROR_CODE.PARTICIPANT_ALREADY_REGISTERED)
      expect(await dataSource.getRepository(ParticipationEntity).countBy({ editionId: edition.id })).toBe(1)
    })

    it('answers 404 for an unknown competitor, 400 for a bad body, 404 for an unknown edition', async () => {
      const edition = await createEdition(2043)
      const path = `/api/v1/editions/${edition.id}/participants`
      const unknown = await asAdmin('POST', path, { competitorId: UNKNOWN_UUID })
      expect(unknown.status).toBe(404)
      expect((await errorOf(unknown)).code).toBe(API_ERROR_CODE.COMPETITOR_NOT_FOUND)
      expect((await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: edition.id })).status).toBe(EDITION_STATUS.CREATED)
      expect((await asAdmin('POST', path, { competitorId: 'nope' })).status).toBe(400)
      expect((await asAdmin('POST', path, { competitorId: UNKNOWN_UUID, role: 'ADMIN' })).status).toBe(400)
      expect((await asAdmin('POST', `/api/v1/editions/${UNKNOWN_UUID}/participants`, { competitorId: UNKNOWN_UUID })).status).toBe(404)
    })

    it('answers 409 when the pools draw is validated', async () => {
      const edition = await createEdition(2044)
      const competitor = await createCompetitor('Trop tard')
      await dataSource.getRepository(DrawEntity).save({
        editionId: edition.id, kind: DRAW_KIND.POOLS, status: DRAW_STATUS.VALIDATED, parameters: { poolCount: 2, seedCount: 2 }, validatedAt: new Date()
      })
      const response = await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: competitor.id })
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.REGISTRATION_CLOSED)
      expect(await dataSource.getRepository(ParticipationEntity).countBy({ editionId: edition.id })).toBe(0)
    })

    it('removes a participant before the draw', async () => {
      const edition = await createEdition(2045)
      const keep = await createCompetitor('Reste')
      const leave = await createCompetitor('Part')
      await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: keep.id })
      const added = await (await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: leave.id })).json() as IEditionParticipant

      const response = await asAdmin('DELETE', `/api/v1/editions/${edition.id}/participants/${added.participationId}`)
      expect(response.status).toBe(204)
      const left = await dataSource.getRepository(ParticipationEntity).find({ where: { editionId: edition.id } })
      expect(left.map((participation) => participation.competitorId)).toEqual([keep.id])
      expect((await asAdmin('DELETE', `/api/v1/editions/${edition.id}/participants/${added.participationId}`)).status).toBe(404)
    })

    it('answers 404 for a participation of another edition', async () => {
      const first = await createEdition(2046)
      const second = await createEdition(2047)
      const competitor = await createCompetitor('Ailleurs')
      const added = await (await asAdmin('POST', `/api/v1/editions/${first.id}/participants`, { competitorId: competitor.id })).json() as IEditionParticipant
      expect((await asAdmin('DELETE', `/api/v1/editions/${second.id}/participants/${added.participationId}`)).status).toBe(404)
      expect(await dataSource.getRepository(ParticipationEntity).countBy({ editionId: first.id })).toBe(1)
    })

    it('removes a participant during a DRAFT pools draw and drops its assignment from the draft (Q1)', async () => {
      const edition = await createEdition(2048)
      const stays = await createCompetitor('Tiré reste')
      const leaves = await createCompetitor('Tiré part')
      const stayed = await (await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: stays.id })).json() as IEditionParticipant
      const left = await (await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: leaves.id })).json() as IEditionParticipant
      const draw = await dataSource.getRepository(DrawEntity).save({
        editionId: edition.id, kind: DRAW_KIND.POOLS, status: DRAW_STATUS.DRAFT, parameters: { poolCount: 1, seedCount: 1 }
      })
      await dataSource.getRepository(DrawAssignmentEntity).save([
        { drawId: draw.id, participationId: stayed.participationId, drawnOrder: 1 },
        { drawId: draw.id, participationId: left.participationId, drawnOrder: 2 }
      ])

      const response = await asAdmin('DELETE', `/api/v1/editions/${edition.id}/participants/${left.participationId}`)
      expect(response.status).toBe(204)
      const assignments = await dataSource.getRepository(DrawAssignmentEntity).find({ where: { drawId: draw.id } })
      expect(assignments.map((assignment) => assignment.participationId)).toEqual([stayed.participationId])
      expect(await dataSource.getRepository(ParticipationEntity).countBy({ editionId: edition.id })).toBe(1)
    })

    it('answers 409 REGISTRATION_CLOSED when the pools draw is validated', async () => {
      const edition = await createEdition(2055)
      const competitor = await createCompetitor('Validé')
      const added = await (await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: competitor.id })).json() as IEditionParticipant
      const draw = await dataSource.getRepository(DrawEntity).save({
        editionId: edition.id, kind: DRAW_KIND.POOLS, status: DRAW_STATUS.VALIDATED, parameters: { poolCount: 1, seedCount: 1 }, validatedAt: new Date()
      })
      await dataSource.getRepository(DrawAssignmentEntity).save({ drawId: draw.id, participationId: added.participationId, drawnOrder: 1 })
      const response = await asAdmin('DELETE', `/api/v1/editions/${edition.id}/participants/${added.participationId}`)
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.REGISTRATION_CLOSED)
      expect(await dataSource.getRepository(ParticipationEntity).countBy({ editionId: edition.id })).toBe(1)
      expect(await dataSource.getRepository(DrawAssignmentEntity).countBy({ drawId: draw.id })).toBe(1)
    })

    it('answers 409 EDITION_CLOSED for adds and removals on a closed edition', async () => {
      const edition = await createEdition(2049)
      const competitor = await createCompetitor('Clos')
      const added = await (await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: competitor.id })).json() as IEditionParticipant
      await dataSource.getRepository(EditionEntity).update({ id: edition.id }, { status: EDITION_STATUS.CLOSED })
      const other = await createCompetitor('Clos bis')
      const add = await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: other.id })
      expect(add.status).toBe(409)
      expect((await errorOf(add)).code).toBe(API_ERROR_CODE.EDITION_CLOSED)
      expect((await asAdmin('DELETE', `/api/v1/editions/${edition.id}/participants/${added.participationId}`)).status).toBe(409)
    })
  })

  describe('GET /admin/editions/{id}/participants', () => {
    const DAY_MS = 24 * 60 * 60 * 1000
    const sha = (seed: string): string => seed.padEnd(64, '0').slice(0, 64)

    const withAccount = async (
      displayName: string,
      account: { status: USER_STATUS, invitations: Array<{ offsetDays: number, consumed?: boolean }> }
    ): Promise<CompetitorEntity> => {
      const competitor = await createCompetitor(displayName)
      const user = await dataSource.getRepository(UserEntity).save({
        email: `${displayName.toLowerCase().replace(/\s+/g, '.')}@admin-list.test`,
        role: USER_ROLE.PARTICIPANT,
        status: account.status,
        passwordHash: null,
        competitorId: competitor.id
      })
      for (const [index, invitation] of account.invitations.entries()) {
        await dataSource.getRepository(InvitationEntity).save({
          userId: user.id,
          tokenHash: sha(`${displayName}${index}`.replace(/\s+/g, '')),
          expiresAt: new Date(Date.now() + invitation.offsetDays * DAY_MS),
          consumedAt: invitation.consumed ? new Date() : null
        })
      }
      return competitor
    }

    it('gives the account state, editions played and no contact data', async () => {
      const edition = await createEdition(2070)
      const earlier = await createEdition(2071)
      const invited = await withAccount('Liste Invité', { status: USER_STATUS.INVITED, invitations: [{ offsetDays: 5 }] })
      // Un renvoi : l'ancienne ligne est expirée, la plus récente est valable.
      const resent = await withAccount('Liste Renvoyé', { status: USER_STATUS.INVITED, invitations: [{ offsetDays: -3 }, { offsetDays: 6 }] })
      const expired = await withAccount('Liste Expiré', { status: USER_STATUS.INVITED, invitations: [{ offsetDays: -1 }] })
      const active = await withAccount('Liste Actif', { status: USER_STATUS.ACTIVE, invitations: [{ offsetDays: -10, consumed: true }] })
      const archive = await createCompetitor('Liste Archive')
      for (const competitor of [invited, resent, expired, active, archive]) {
        expect((await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: competitor.id })).status).toBe(201)
      }
      await asAdmin('POST', `/api/v1/editions/${earlier.id}/participants`, { competitorId: active.id })

      const response = await asAdmin('GET', `/api/v1/admin/editions/${edition.id}/participants`)
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
      const raw = await response.text()
      const rows = JSON.parse(raw) as IAdminParticipant[]
      const byName = new Map(rows.map((row) => [row.competitor.displayName, row]))

      expect(byName.get('Liste Invité')!.account).toMatchObject({ state: ACCOUNT_STATE.INVITED })
      expect(byName.get('Liste Invité')!.account!.invitationExpiresAt).toEqual(expect.any(String))
      expect(byName.get('Liste Renvoyé')!.account!.state).toBe(ACCOUNT_STATE.INVITED)
      expect(byName.get('Liste Expiré')!.account!.state).toBe(ACCOUNT_STATE.INVITATION_EXPIRED)
      expect(byName.get('Liste Actif')!.account).toEqual({ state: ACCOUNT_STATE.ACTIVE, invitationExpiresAt: null })
      expect(byName.get('Liste Archive')!.account).toBeNull()
      expect(byName.get('Liste Actif')!.editionsPlayed).toBe(2)
      expect(byName.get('Liste Archive')!.editionsPlayed).toBe(1)
      expect(byName.get('Liste Archive')).toMatchObject({ participationId: expect.any(String), poolId: null })
      expect(raw).not.toMatch(/admin-list\.test|@|11 22|phone|email/i)
    })

    it('is addressable by code and answers 404 for an unknown edition', async () => {
      const edition = await createEdition(2072)
      const byCode = await asAdmin('GET', `/api/v1/admin/editions/${edition.code}/participants`)
      expect(byCode.status).toBe(200)
      expect(await byCode.json()).toEqual([])
      expect((await asAdmin('GET', `/api/v1/admin/editions/${UNKNOWN_UUID}/participants`)).status).toBe(404)
    })
  })
})
