import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { DRAW_STATUS } from '../../src/enums/draw.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { FINAL_STAGE } from '../../src/enums/participation.enum'
import { ROUND_STATUS } from '../../src/enums/round.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IAdminDraw, IDraw, ISeedProposal } from '../../src/interfaces/draw.interface'
import type { IEditionParticipant, IEditionSummary } from '../../src/interfaces/edition.interface'
import type { IApiError } from '../../src/interfaces/error.interface'
import type { IMatch } from '../../src/interfaces/match.interface'
import type { IPaginated } from '../../src/interfaces/pagination.interface'
import type { IPool } from '../../src/interfaces/pool.interface'
import type { IRound } from '../../src/interfaces/round.interface'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { MatchEntity } from '../../src/server/db/typeorm/entities/match.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { RoundEntity } from '../../src/server/db/typeorm/entities/round.entity'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { TEST_SITE_URL } from './helpers/mail-capture'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000'

let dataSource: DataSource
let adminCookie: string
let participantCookie: string
let year = 2030
let competitorSerial = 0

const send = (method: string, path: string, body?: unknown, cookie?: string): Promise<Response> =>
  fetch(path, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
const asAdmin = (method: string, path: string, body?: unknown) => send(method, path, body, adminCookie)
const errorOf = async (response: Response): Promise<IApiError> => await response.json() as IApiError

/** Un compétiteur, avec au besoin un historique dans une édition close (points + stade final) qui fait son ACP. */
const createCompetitor = async (name: string, history?: { points: number, finalStage?: FINAL_STAGE }): Promise<CompetitorEntity> => {
  const competitor = await dataSource.getRepository(CompetitorEntity).save({ displayName: `${name} ${competitorSerial += 1}` })
  if (history) {
    const closed = await closedEdition()
    await dataSource.getRepository(ParticipationEntity).save({
      editionId: closed.id, competitorId: competitor.id, points: history.points, finalStage: history.finalStage ?? null
    })
  }
  return competitor
}

let closedEditionPromise: Promise<EditionEntity> | undefined
const closedEdition = (): Promise<EditionEntity> => {
  closedEditionPromise ??= dataSource.getRepository(EditionEntity).save({
    code: '1999z', year: 1999, chronologicalRank: 1, origin: EDITION_ORIGIN.APP, status: EDITION_STATUS.CLOSED, name: 'Historique'
  })
  return closedEditionPromise
}

/** Une édition vide (le code CE-1 est calculé par le serveur), puis ses inscrits par la route B-10. */
const openEdition = async (competitors: CompetitorEntity[]): Promise<{ edition: IEditionSummary, participants: IEditionParticipant[] }> => {
  year += 1
  const created = await asAdmin('POST', '/api/v1/editions', { year, name: `Tirage ${year}` })
  expect(created.status).toBe(201)
  const edition = await created.json() as IEditionSummary
  const participants: IEditionParticipant[] = []
  for (const competitor of competitors) {
    const added = await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: competitor.id })
    expect(added.status).toBe(201)
    participants.push(await added.json() as IEditionParticipant)
  }
  return { edition, participants }
}

const idOf = (participants: IEditionParticipant[], competitor: CompetitorEntity): string =>
  participants.find((participant) => participant.competitor.id === competitor.id)!.participationId

/** 6 inscrits dont 2 têtes de série évidentes (A et B) ; poules {A, C, E} et {B, D, F}. */
const sixPlayers = async () => {
  const [a, b, c, d, e, f] = await Promise.all([
    createCompetitor('A', { points: 50, finalStage: FINAL_STAGE.CHAMPION }),
    createCompetitor('B', { points: 40, finalStage: FINAL_STAGE.FINALIST }),
    createCompetitor('C', { points: 30 }),
    createCompetitor('D', { points: 20 }),
    createCompetitor('E', { points: 10 }),
    createCompetitor('F', { points: 5 })
  ])
  const { edition, participants } = await openEdition([a!, b!, c!, d!, e!, f!])
  const id = (competitor: CompetitorEntity | undefined) => idOf(participants, competitor!)
  return {
    edition,
    ids: { a: id(a), b: id(b), c: id(c), d: id(d), e: id(e), f: id(f) },
    poolOne: [id(a), id(c), id(e)],
    poolTwo: [id(b), id(d), id(f)]
  }
}

const openDraft = async (editionId: string, seeds: string[], poolCount = 2): Promise<IAdminDraw> => {
  const response = await asAdmin('POST', `/api/v1/editions/${editionId}/tirages/poules`, { poolCount, seedCount: poolCount, seeds })
  expect(response.status).toBe(201)
  return await response.json() as IAdminDraw
}

const fullAssignments = (poolOne: string[], poolTwo: string[]) => [
  { participationId: poolOne[0]!, poolNumber: 1, drawnOrder: 1 },
  { participationId: poolTwo[0]!, poolNumber: 2, drawnOrder: 2 },
  { participationId: poolOne[1]!, poolNumber: 1, drawnOrder: 3 },
  { participationId: poolTwo[1]!, poolNumber: 2, drawnOrder: 4 },
  { participationId: poolOne[2]!, poolNumber: 1, drawnOrder: 5 },
  { participationId: poolTwo[2]!, poolNumber: 2, drawnOrder: 6 }
]

const putAssignments = (drawId: string, assignments: unknown[]) =>
  asAdmin('PUT', `/api/v1/tirages/${drawId}/affectations`, { assignments })

const readyDraft = async () => {
  const players = await sixPlayers()
  const draft = await openDraft(players.edition.id, [players.ids.a, players.ids.b])
  expect((await putAssignments(draft.id, fullAssignments(players.poolOne, players.poolTwo))).status).toBe(200)
  return { ...players, draft }
}

describe('pools draw (B-11)', async () => {
  const env = requireTestDatabaseEnv()
  dataSource = await resetTestDatabase()
  await seedUser(dataSource, { email: 'boss@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  await seedUser(dataSource, { email: 'player@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000', NUXT_PUBLIC_SITE_URL: TEST_SITE_URL }
  })

  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login('boss@ccc.test', PASSWORD))
    participantCookie = cookieHeaderOf(await login('player@ccc.test', PASSWORD))
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  describe('authorization', () => {
    const routes: Array<[string, string, unknown]> = [
      ['GET', `/api/v1/editions/${UNKNOWN_UUID}/tetes-de-serie?poules=2`, undefined],
      ['POST', `/api/v1/editions/${UNKNOWN_UUID}/tirages/poules`, { poolCount: 2, seedCount: 2, seeds: [UNKNOWN_UUID, UNKNOWN_UUID] }],
      ['PUT', `/api/v1/tirages/${UNKNOWN_UUID}/affectations`, { assignments: [] }],
      ['POST', `/api/v1/tirages/${UNKNOWN_UUID}/validation`, undefined],
      ['GET', `/api/v1/admin/editions/${UNKNOWN_UUID}/tirages`, undefined]
    ]

    it.each(routes)('%s %s answers 401 to an anonymous caller', async (method, path, body) => {
      const response = await send(method, path, body)
      expect(response.status).toBe(401)
    })

    it.each(routes)('%s %s answers 403 to a participant', async (method, path, body) => {
      const response = await send(method, path, body, participantCookie)
      expect(response.status).toBe(403)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.FORBIDDEN)
    })
  })

  describe('GET /editions/{id}/tetes-de-serie', () => {
    it('proposes the best ACP first, with their ACP and rank', async () => {
      const { edition, ids } = await sixPlayers()
      const response = await asAdmin('GET', `/api/v1/editions/${edition.id}/tetes-de-serie?poules=2`)
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
      const proposal = await response.json() as ISeedProposal
      expect(proposal.seeds.map((seed) => seed.participationId)).toEqual([ids.a, ids.b])
      expect(proposal.seeds.map((seed) => [seed.rank, seed.acp])).toEqual([[1, 50], [2, 40]])
      expect(proposal.unresolvedTies).toEqual([])
      expect(JSON.stringify(proposal)).not.toMatch(/email|phone/i)
    })

    it('reports a perfect tie that straddles the frontier instead of breaking it (RG10)', async () => {
      const first = await createCompetitor('Ex æquo', { points: 30 })
      const second = await createCompetitor('Ex æquo', { points: 30 })
      const top = await createCompetitor('Tête', { points: 90, finalStage: FINAL_STAGE.CHAMPION })
      const { edition, participants } = await openEdition([first, second, top])
      const proposal = await (await asAdmin('GET', `/api/v1/editions/${edition.id}/tetes-de-serie?poules=2`)).json() as ISeedProposal
      expect(proposal.seeds[0]!.participationId).toBe(idOf(participants, top))
      expect(proposal.unresolvedTies).toHaveLength(1)
      expect(new Set(proposal.unresolvedTies[0])).toEqual(new Set([idOf(participants, first), idOf(participants, second)]))
    })

    it.each(['0', '-1', 'abc', '1.5', '99999'])('answers 400 for poules=%s', async (poules) => {
      const { edition } = await sixPlayers()
      expect((await asAdmin('GET', `/api/v1/editions/${edition.id}/tetes-de-serie?poules=${poules}`)).status).toBe(400)
    })

    it('answers 400 when there are more pools than participants, and 404 for an unknown edition', async () => {
      const { edition } = await sixPlayers()
      expect((await asAdmin('GET', `/api/v1/editions/${edition.id}/tetes-de-serie?poules=7`)).status).toBe(400)
      expect((await asAdmin('GET', `/api/v1/editions/${UNKNOWN_UUID}/tetes-de-serie?poules=2`)).status).toBe(404)
    })
  })

  describe('POST /editions/{id}/tirages/poules', () => {
    it('opens a DRAFT with the seeds first, without pools', async () => {
      const { edition, ids } = await sixPlayers()
      const draft = await openDraft(edition.id, [ids.a, ids.b])
      expect(draft).toMatchObject({ status: DRAW_STATUS.DRAFT, parameters: { poolCount: 2, seedCount: 2 }, validatedAt: null, validatedBy: null })
      expect(draft.createdBy).not.toBeNull()
      expect(draft.assignments.map((assignment) => [assignment.participationId, assignment.drawnOrder, assignment.poolNumber])).toEqual([
        [ids.a, 1, null], [ids.b, 2, null]
      ])
      expect(await dataSource.getRepository(RoundEntity).countBy({ editionId: edition.id })).toBe(0)
    })

    it('answers 409 when seedCount differs from poolCount (RG9)', async () => {
      const { edition, ids } = await sixPlayers()
      const response = await asAdmin('POST', `/api/v1/editions/${edition.id}/tirages/poules`, { poolCount: 2, seedCount: 1, seeds: [ids.a] })
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.DRAW_SEEDS_INVALID)
    })

    it('answers 409 when the seeds are not the top ones (RG9), including foreign participations', async () => {
      const { edition, ids } = await sixPlayers()
      const other = await sixPlayers()
      const path = `/api/v1/editions/${edition.id}/tirages/poules`
      const wrong = await asAdmin('POST', path, { poolCount: 2, seedCount: 2, seeds: [ids.a, ids.c] })
      expect(wrong.status).toBe(409)
      expect((await errorOf(wrong)).code).toBe(API_ERROR_CODE.DRAW_SEEDS_INVALID)
      expect((await asAdmin('POST', path, { poolCount: 2, seedCount: 2, seeds: [ids.a, other.ids.b] })).status).toBe(409)
      expect((await asAdmin('POST', path, { poolCount: 2, seedCount: 2, seeds: [ids.a, ids.a] })).status).toBe(409)
      expect((await asAdmin('POST', path, { poolCount: 2, seedCount: 2, seeds: [ids.a, UNKNOWN_UUID] })).status).toBe(409)
    })

    it('lets the administrator choose among a perfect tie on the frontier', async () => {
      const first = await createCompetitor('Choix', { points: 30 })
      const second = await createCompetitor('Choix', { points: 30 })
      const top = await createCompetitor('Tête', { points: 90, finalStage: FINAL_STAGE.CHAMPION })
      const { edition, participants } = await openEdition([first, second, top])
      const path = `/api/v1/editions/${edition.id}/tirages/poules`
      expect((await asAdmin('POST', path, { poolCount: 2, seedCount: 2, seeds: [idOf(participants, top), idOf(participants, second)] })).status).toBe(201)
      expect((await asAdmin('POST', path, { poolCount: 2, seedCount: 2, seeds: [idOf(participants, top), idOf(participants, first)] })).status).toBe(201)
    })

    it.each([
      ['a zero pool count', { poolCount: 0, seedCount: 0, seeds: [] }],
      ['a negative pool count', { poolCount: -1, seedCount: -1, seeds: [] }],
      ['too many seeds in the list', { poolCount: 2, seedCount: 2, seeds: Array.from({ length: 50 }, () => UNKNOWN_UUID) }],
      ['an invalid uuid', { poolCount: 2, seedCount: 2, seeds: ['nope', 'nope'] }],
      ['an unknown field', { poolCount: 2, seedCount: 2, seeds: [UNKNOWN_UUID, UNKNOWN_UUID], status: 'VALIDATED' }]
    ])('answers 400 for %s', async (_label, body) => {
      const { edition } = await sixPlayers()
      expect((await asAdmin('POST', `/api/v1/editions/${edition.id}/tirages/poules`, body)).status).toBe(400)
    })

    it('answers 400 when there are more pools than participants', async () => {
      const { edition, ids } = await sixPlayers()
      const response = await asAdmin('POST', `/api/v1/editions/${edition.id}/tirages/poules`, { poolCount: 7, seedCount: 7, seeds: Object.values(ids) })
      expect(response.status).toBe(400)
    })

    it('replaces an existing DRAFT instead of failing', async () => {
      const { edition, ids } = await sixPlayers()
      const first = await openDraft(edition.id, [ids.a, ids.b])
      const second = await openDraft(edition.id, [ids.b, ids.a])
      expect(second.id).not.toBe(first.id)
      const drafts = await (await asAdmin('GET', `/api/v1/admin/editions/${edition.id}/tirages`)).json() as IAdminDraw[]
      expect(drafts.map((draw) => draw.id)).toEqual([second.id])
    })
  })

  describe('PUT /tirages/{id}/affectations', () => {
    it('records the physical draw and is idempotent', async () => {
      const { draft, poolOne, poolTwo } = await readyDraft()
      const again = await putAssignments(draft.id, fullAssignments(poolOne, poolTwo))
      expect(again.status).toBe(200)
      const body = await again.json() as IAdminDraw
      expect(body.status).toBe(DRAW_STATUS.DRAFT)
      expect(body.assignments).toHaveLength(6)
      expect(body.assignments.map((assignment) => assignment.poolNumber)).toEqual([1, 2, 1, 2, 1, 2])
      expect(body.assignments.map((assignment) => assignment.drawnOrder)).toEqual([1, 2, 3, 4, 5, 6])
      expect(body.assignments.every((assignment) => assignment.poolId === null)).toBe(true)
    })

    it('accepts a partial draft (the draw is recorded assignment after assignment)', async () => {
      const { edition, ids } = await sixPlayers()
      const draft = await openDraft(edition.id, [ids.a, ids.b])
      const response = await putAssignments(draft.id, [
        { participationId: ids.a, poolNumber: 1, drawnOrder: 1 },
        { participationId: ids.b, poolNumber: 2, drawnOrder: 2 },
        { participationId: ids.c, poolNumber: 2, drawnOrder: 3 }
      ])
      expect(response.status).toBe(200)
    })

    it('answers 409 when two seeds share a pool (RG11)', async () => {
      const { edition, ids } = await sixPlayers()
      const draft = await openDraft(edition.id, [ids.a, ids.b])
      const response = await putAssignments(draft.id, [
        { participationId: ids.a, poolNumber: 1, drawnOrder: 1 },
        { participationId: ids.b, poolNumber: 1, drawnOrder: 2 }
      ])
      expect(response.status).toBe(409)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.DRAW_INCONSISTENT)
    })

    it('answers 409 for a participation of another edition (no IDOR), a changed seed set or a duplicate', async () => {
      const { edition, ids } = await sixPlayers()
      const other = await sixPlayers()
      const draft = await openDraft(edition.id, [ids.a, ids.b])
      const seeds = [{ participationId: ids.a, poolNumber: 1, drawnOrder: 1 }, { participationId: ids.b, poolNumber: 2, drawnOrder: 2 }]
      expect((await putAssignments(draft.id, [...seeds, { participationId: other.ids.c, poolNumber: 1, drawnOrder: 3 }])).status).toBe(409)
      expect((await putAssignments(draft.id, [seeds[0]!, { participationId: ids.c, poolNumber: 2, drawnOrder: 2 }])).status).toBe(409)
      expect((await putAssignments(draft.id, [...seeds, { participationId: ids.c, poolNumber: 1, drawnOrder: 3 }, { participationId: ids.c, poolNumber: 2, drawnOrder: 4 }])).status).toBe(409)
      expect((await putAssignments(draft.id, [...seeds, { participationId: ids.d, poolNumber: 1, drawnOrder: 2 }])).status).toBe(409)
      expect((await putAssignments(draft.id, [...seeds, { participationId: ids.d, poolNumber: 3, drawnOrder: 3 }])).status).toBe(409)
    })

    it.each([
      ['a zero pool number', { participationId: UNKNOWN_UUID, poolNumber: 0, drawnOrder: 1 }],
      ['a zero order', { participationId: UNKNOWN_UUID, poolNumber: 1, drawnOrder: 0 }],
      ['a fractional order', { participationId: UNKNOWN_UUID, poolNumber: 1, drawnOrder: 1.5 }],
      ['an invalid uuid', { participationId: 'nope', poolNumber: 1, drawnOrder: 1 }],
      ['an unknown field', { participationId: UNKNOWN_UUID, poolNumber: 1, drawnOrder: 1, poolRank: 1 }]
    ])('answers 400 for %s', async (_label, assignment) => {
      const { edition, ids } = await sixPlayers()
      const draft = await openDraft(edition.id, [ids.a, ids.b])
      expect((await putAssignments(draft.id, [assignment])).status).toBe(400)
    })

    it('answers 404 for an unknown draw and 400 for a malformed id', async () => {
      expect((await putAssignments(UNKNOWN_UUID, [])).status).toBe(404)
      expect((await putAssignments('nope', [])).status).toBe(400)
    })
  })

  describe('POST /tirages/{id}/validation', () => {
    it('creates the pools, n(n-1)/2 matches per pool, a DRAWN round, and moves the edition to POOLS_DRAWN', async () => {
      const { edition, draft, ids } = await readyDraft()
      const response = await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)
      expect(response.status).toBe(200)
      const draw = await response.json() as IAdminDraw
      expect(draw.status).toBe(DRAW_STATUS.VALIDATED)
      expect(draw.validatedAt).toEqual(expect.any(String))
      expect(draw.validatedBy).not.toBeNull()
      expect(draw.assignments.map((assignment) => assignment.poolNumber)).toEqual([1, 2, 1, 2, 1, 2])
      expect(draw.assignments.every((assignment) => assignment.poolId !== null)).toBe(true)

      const stored = await dataSource.getRepository(EditionEntity).findOneByOrFail({ id: edition.id })
      expect(stored.status).toBe(EDITION_STATUS.POOLS_DRAWN)
      const rounds = await dataSource.getRepository(RoundEntity).findBy({ editionId: edition.id })
      expect(rounds).toHaveLength(1)
      expect(rounds[0]!.status).toBe(ROUND_STATUS.DRAWN)
      const matches = await dataSource.getRepository(MatchEntity).find({ where: { editionId: edition.id }, relations: { pool: true } })
      expect(matches).toHaveLength(6)
      for (const rank of [1, 2]) {
        expect(matches.filter((match) => match.pool!.rank === rank)).toHaveLength(3)
      }
      expect(new Set(matches.map((match) => match.sequence)).size).toBe(6)
      expect(matches.every((match) => match.targetScore === 5)).toBe(true)
      const seeds = await dataSource.getRepository(ParticipationEntity).find({ where: { editionId: edition.id, isSeed: true } })
      expect(seeds.map((participation) => participation.id).sort()).toEqual([ids.a, ids.b].sort())
    })

    it('is idempotent: a second validation answers 200 and creates no match', async () => {
      const { edition, draft } = await readyDraft()
      const first = await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)
      const second = await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)
      expect([first.status, second.status]).toEqual([200, 200])
      expect(await dataSource.getRepository(MatchEntity).countBy({ editionId: edition.id })).toBe(6)
      expect(await dataSource.getRepository(RoundEntity).countBy({ editionId: edition.id })).toBe(1)
      expect((await second.json() as IAdminDraw).validatedAt).toBe((await first.json() as IAdminDraw).validatedAt)
    })

    it('produces a single set of matches under two simultaneous validations', async () => {
      const { edition, draft } = await readyDraft()
      const responses = await Promise.all([1, 2, 3].map(() => asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)))
      expect(responses.map((response) => response.status)).toEqual([200, 200, 200])
      expect(await dataSource.getRepository(MatchEntity).countBy({ editionId: edition.id })).toBe(6)
      expect(await dataSource.getRepository(RoundEntity).countBy({ editionId: edition.id })).toBe(1)
    })

    it('answers 409 while a registered participant is not assigned (Q2), then 200 once assigned', async () => {
      const { edition, draft, poolOne, poolTwo } = await readyDraft()
      const late = await createCompetitor('Retardataire')
      const added = await (await asAdmin('POST', `/api/v1/editions/${edition.id}/participants`, { competitorId: late.id })).json() as IEditionParticipant
      const refused = await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)
      expect(refused.status).toBe(409)
      expect((await errorOf(refused)).code).toBe(API_ERROR_CODE.DRAW_INCOMPLETE)
      expect(await dataSource.getRepository(MatchEntity).countBy({ editionId: edition.id })).toBe(0)

      expect((await putAssignments(draft.id, [...fullAssignments(poolOne, poolTwo), { participationId: added.participationId, poolNumber: 2, drawnOrder: 7 }])).status).toBe(200)
      expect((await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)).status).toBe(200)
      expect(await dataSource.getRepository(MatchEntity).countBy({ editionId: edition.id })).toBe(3 + 6)
    })

    it('validates without a participant removed during the draft (Q1, with the B-10 removal route)', async () => {
      const { edition, draft, ids } = await readyDraft()
      const removed = await asAdmin('DELETE', `/api/v1/editions/${edition.id}/participants/${ids.f}`)
      expect(removed.status).toBe(204)
      const admin = await (await asAdmin('GET', `/api/v1/admin/editions/${edition.id}/tirages`)).json() as IAdminDraw[]
      expect(admin[0]!.assignments.map((assignment) => assignment.participationId)).not.toContain(ids.f)

      expect((await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)).status).toBe(200)
      // Poule 1 : 3 joueurs (3 matchs), poule 2 : 2 joueurs (1 match). Les tailles inégales sont permises (RG16).
      expect(await dataSource.getRepository(MatchEntity).countBy({ editionId: edition.id })).toBe(4)
    })

    it('answers 409 when a pool has no seed (RG11) and writes nothing', async () => {
      const { edition, ids } = await sixPlayers()
      const draft = await openDraft(edition.id, [ids.a, ids.b])
      // Les deux têtes de série dans des poules distinctes sont exigées dès l'enregistrement ; on ne laisse donc qu'un brouillon sans numéro.
      const response = await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)
      expect(response.status).toBe(409)
      expect(await dataSource.getRepository(MatchEntity).countBy({ editionId: edition.id })).toBe(0)
      expect(await dataSource.getRepository(RoundEntity).countBy({ editionId: edition.id })).toBe(0)
    })

    it('refuses to change or re-open a validated draw (no cancellation)', async () => {
      const { edition, draft, ids, poolOne, poolTwo } = await readyDraft()
      await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)
      const put = await putAssignments(draft.id, fullAssignments(poolOne, poolTwo))
      expect(put.status).toBe(409)
      expect((await errorOf(put)).code).toBe(API_ERROR_CODE.DRAW_ALREADY_VALIDATED)
      const post = await asAdmin('POST', `/api/v1/editions/${edition.id}/tirages/poules`, { poolCount: 2, seedCount: 2, seeds: [ids.a, ids.b] })
      expect(post.status).toBe(409)
      expect((await errorOf(post)).code).toBe(API_ERROR_CODE.DRAW_ALREADY_VALIDATED)
      const removal = await asAdmin('DELETE', `/api/v1/editions/${edition.id}/participants/${ids.c}`)
      expect(removal.status).toBe(409)
    })

    it('answers 404 for an unknown draw', async () => {
      expect((await asAdmin('POST', `/api/v1/tirages/${UNKNOWN_UUID}/validation`)).status).toBe(404)
    })
  })

  describe('visibility', () => {
    it('keeps a DRAFT out of the public API, shows it to the administrator, and publishes the draw once validated', async () => {
      const { edition, draft } = await readyDraft()
      const publicDraws = async () => await (await fetch(`/api/v1/editions/${edition.id}/tirages`)).json() as IDraw[]
      const adminDraws = async () => await (await asAdmin('GET', `/api/v1/admin/editions/${edition.id}/tirages`)).json() as IAdminDraw[]

      expect(await publicDraws()).toEqual([])
      expect(JSON.stringify(await (await fetch(`/api/v1/editions/${edition.id}`)).json())).not.toContain(draft.id)
      const drafts = await asAdmin('GET', `/api/v1/admin/editions/${edition.id}/tirages`)
      expect(drafts.headers.get('cache-control')).toBe('no-store')
      expect((await drafts.json() as IAdminDraw[]).map((draw) => [draw.id, draw.status])).toEqual([[draft.id, DRAW_STATUS.DRAFT]])
      expect((await (await fetch(`/api/v1/editions/${edition.id}/poules`)).json() as IPool[])).toEqual([])

      await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)
      const published = await publicDraws()
      expect(published).toHaveLength(1)
      expect(published[0]).toMatchObject({ id: draft.id, status: DRAW_STATUS.VALIDATED, validatedAt: expect.any(String) })
      expect(published[0]!.assignments.map((assignment) => assignment.poolNumber)).toEqual([1, 2, 1, 2, 1, 2])
      expect(JSON.stringify(published)).not.toMatch(/createdBy|validatedBy/)
      const [admin] = await adminDraws()
      expect(admin!.createdBy).not.toBeNull()
      expect(admin!.validatedBy).not.toBeNull()
    })

    it('makes the POOLS round, its pools and its matches visible to the public after validation', async () => {
      const { edition, draft } = await readyDraft()
      const rounds = async () => await (await fetch(`/api/v1/editions/${edition.id}/tours`)).json() as IRound[]
      const matches = async () => await (await fetch(`/api/v1/editions/${edition.id}/matchs`)).json() as IPaginated<IMatch>
      expect(await rounds()).toEqual([])
      expect((await matches()).total).toBe(0)

      await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)
      const [round] = await rounds()
      expect(round).toMatchObject({ status: ROUND_STATUS.DRAWN, matchCount: 6, validatedMatchCount: 0 })
      expect((await matches()).total).toBe(6)
      const pools = await (await fetch(`/api/v1/editions/${edition.id}/poules`)).json() as IPool[]
      expect(pools.map((pool) => pool.standing.length)).toEqual([3, 3])
    })

    it('invalidates the public ETag when the draw is validated', async () => {
      const { edition, draft } = await readyDraft()
      const before = await fetch(`/api/v1/editions/${edition.id}/tirages`)
      const etag = before.headers.get('etag')!
      await asAdmin('POST', `/api/v1/tirages/${draft.id}/validation`)
      const after = await fetch(`/api/v1/editions/${edition.id}/tirages`, { headers: { 'If-None-Match': etag } })
      expect(after.status).toBe(200)
    })
  })
})
