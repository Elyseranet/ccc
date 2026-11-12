import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { ADMIN_ACTIVITY_KIND, ADMIN_ACTIVITY_TARGET } from '../../src/enums/admin-activity.enum'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { DRAW_KIND } from '../../src/enums/draw.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { FINAL_STAGE } from '../../src/enums/participation.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IAdminActivityItem } from '../../src/interfaces/admin-activity.interface'
import type { IAdminMatch } from '../../src/interfaces/admin-match.interface'
import type { IAdminDraw } from '../../src/interfaces/draw.interface'
import type { IEditionParticipant, IEditionSummary } from '../../src/interfaces/edition.interface'
import type { IApiError } from '../../src/interfaces/error.interface'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { TEST_SITE_URL } from './helpers/mail-capture'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000'

let dataSource: DataSource
let adminCookie: string
let participantCookie: string
let bareAdminCookie: string
let year = 2030
let competitorSerial = 0

const send = (method: string, path: string, body?: unknown, cookie?: string, headers: Record<string, string> = {}): Promise<Response> =>
  fetch(path, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
const asAdmin = (method: string, path: string, body?: unknown) => send(method, path, body, adminCookie)

/** Enregistre puis valide un score : chaque écriture porte `If-Match` de la version courante du match (T-SEC-08). */
const recordAndValidate = async (match: IAdminMatch, body: { scores: Array<{ participationId: string, score: number }> }): Promise<void> => {
  const recorded = await send('PUT', `/api/v1/matchs/${match.id}/score`, body, adminCookie, { 'If-Match': `"${match.version}"` })
  expect(recorded.status).toBe(200)
  const { version } = await recorded.json() as IAdminMatch
  expect((await send('POST', `/api/v1/matchs/${match.id}/validation`, body, adminCookie, { 'If-Match': `"${version}"` })).status).toBe(200)
}
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

describe('admin activity feed (B-15)', async () => {
  const env = requireTestDatabaseEnv()
  dataSource = await resetTestDatabase()
  // Rang chronologique 1 posé avant toute création par l'API, qui prend MAX + 1 : sinon `uq_editions_chronological_rank`.
  await closedEdition()
  // Un administrateur avec compétiteur : son nom affiché est le seul champ d'identité attendu dans le flux.
  const admin = await seedUser(dataSource, { email: 'boss-b15@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN, withCompetitor: true })
  const bareAdmin = await seedUser(dataSource, { email: 'bare-b15@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  await seedUser(dataSource, { email: 'player-b15@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000', NUXT_PUBLIC_SITE_URL: TEST_SITE_URL }
  })

  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login('boss-b15@ccc.test', PASSWORD))
    participantCookie = cookieHeaderOf(await login('player-b15@ccc.test', PASSWORD))
    bareAdminCookie = cookieHeaderOf(await login('bare-b15@ccc.test', PASSWORD))
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const activityPath = (editionId: string, query = '') => `/api/v1/admin/editions/${editionId}/activite${query}`
  const activityOf = async (editionId: string, query = ''): Promise<IAdminActivityItem[]> => {
    const response = await asAdmin('GET', activityPath(editionId, query))
    expect(response.status).toBe(200)
    return await response.json() as IAdminActivityItem[]
  }

  describe('authorization', () => {
    it('answers 401 to an anonymous caller', async () => {
      expect((await send('GET', activityPath(UNKNOWN_UUID))).status).toBe(401)
    })

    it('answers 403 to a participant', async () => {
      const response = await send('GET', activityPath(UNKNOWN_UUID), undefined, participantCookie)
      expect(response.status).toBe(403)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.FORBIDDEN)
    })
  })

  describe('feed', () => {
    it('is empty for an edition without activity, and answers 404 for an unknown edition', async () => {
      const { edition } = await openEdition([])
      const response = await asAdmin('GET', activityPath(edition.id))
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(await response.json()).toEqual([])
      const unknown = await asAdmin('GET', activityPath(UNKNOWN_UUID))
      expect(unknown.status).toBe(404)
      expect((await errorOf(unknown)).code).toBe(API_ERROR_CODE.NOT_FOUND)
    })

    it('lists a draft draw as DRAW_CREATED, then a validated draw and a validated match, most recent first, with their author', async () => {
      const ready = await readyDraft()
      const editionId = ready.edition.id

      const afterDraft = await activityOf(editionId)
      expect(afterDraft).toHaveLength(1)
      expect(afterDraft[0]).toMatchObject({
        kind: ADMIN_ACTIVITY_KIND.DRAW_CREATED,
        actor: { id: admin.id, displayName: `Joueur ${admin.email}` },
        target: { type: ADMIN_ACTIVITY_TARGET.DRAW, id: ready.draft.id, drawKind: DRAW_KIND.POOLS, roundKind: null, poolCount: 2, seedCount: 2 }
      })

      expect((await asAdmin('POST', `/api/v1/tirages/${ready.draft.id}/validation`)).status).toBe(200)
      const matches = await (await asAdmin('GET', `/api/v1/admin/editions/${editionId}/matchs`)).json() as IAdminMatch[]
      const match = matches[0]!
      const scores = match.sides.map((side, index) => ({ participationId: side.participationId, score: index === 0 ? match.targetScore : 0 }))
      await recordAndValidate(match, { scores })

      const feed = await activityOf(editionId)
      expect(feed.map((item) => item.kind)).toEqual([
        ADMIN_ACTIVITY_KIND.MATCH_VALIDATED, ADMIN_ACTIVITY_KIND.DRAW_VALIDATED, ADMIN_ACTIVITY_KIND.DRAW_CREATED
      ])
      const times = feed.map((item) => Date.parse(item.at))
      expect(times).toEqual([...times].sort((a, b) => b - a))
      for (const item of feed) {
        expect(item.actor).toEqual({ id: admin.id, displayName: `Joueur ${admin.email}` })
      }
      expect(feed[0]!.target).toMatchObject({
        type: ADMIN_ACTIVITY_TARGET.MATCH, id: match.id, matchSequence: match.sequence, roundKind: ROUND_KIND.POOLS
      })
      const target = feed[0]!.target as { sides: Array<{ participationId: string, score: number | null }>, poolNumber: number | null }
      expect(target.poolNumber).toBe(match.poolRank)
      expect(target.sides.map((side) => side.score)).toEqual([match.targetScore, 0])
      expect(feed[1]!.target).toMatchObject({ type: ADMIN_ACTIVITY_TARGET.DRAW, id: ready.draft.id, poolCount: 2, seedCount: 2 })

      expect(await activityOf(editionId, '?limit=1')).toEqual([feed[0]])
      expect(await activityOf(editionId, '?limit=2')).toEqual(feed.slice(0, 2))
      expect(await activityOf(editionId, '?limit=100')).toEqual(feed)

      const serialized = JSON.stringify(feed)
      // Le nom affiché de l'administrateur de test embarque son adresse (fixture) : on vérifie les champs, pas le caractère.
      expect(serialized).not.toContain('+33')
      expect(serialized).not.toMatch(/"(email|phone|firstName|lastName|passwordHash)"/)
    })

    it('lists a corrected match as one MATCH_VALIDATED entry, dated at the correction, with the author of the correction', async () => {
      const ready = await readyDraft()
      expect((await asAdmin('POST', `/api/v1/tirages/${ready.draft.id}/validation`)).status).toBe(200)
      const listMatches = async () => await (await asAdmin('GET', `/api/v1/admin/editions/${ready.edition.id}/matchs`)).json() as IAdminMatch[]
      const match = (await listMatches())[0]!
      const body = (values: number[]) => ({
        scores: match.sides.map((side, index) => ({ participationId: side.participationId, score: values[index]! }))
      })
      await recordAndValidate(match, body([match.targetScore, 0]))
      const validated = (await activityOf(ready.edition.id)).filter((item) => item.target.id === match.id)
      expect(validated).toHaveLength(1)

      const current = (await listMatches()).find((candidate) => candidate.id === match.id)!
      const corrected = await fetch(`/api/v1/matchs/${match.id}/correction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: bareAdminCookie, 'If-Match': `"${current.version}"` },
        body: JSON.stringify(body([match.targetScore, 1]))
      })
      expect(corrected.status).toBe(200)

      const feed = (await activityOf(ready.edition.id)).filter((item) => item.target.id === match.id)
      expect(feed).toHaveLength(1)
      expect(feed[0]).toMatchObject({ kind: ADMIN_ACTIVITY_KIND.MATCH_VALIDATED, actor: { id: bareAdmin.id, displayName: bareAdmin.email } })
      expect(Date.parse(feed[0]!.at)).toBeGreaterThan(Date.parse(validated[0]!.at))
      const target = feed[0]!.target as { sides: Array<{ score: number | null }> }
      expect(target.sides.map((side) => side.score)).toEqual([match.targetScore, 1])
    })

    it('names an administrator without competitor by their email (visible to administrators only)', async () => {
      const players = await sixPlayers()
      const opened = await send('POST', `/api/v1/editions/${players.edition.id}/tirages/poules`, {
        poolCount: 2, seedCount: 2, seeds: [players.ids.a, players.ids.b]
      }, bareAdminCookie)
      expect(opened.status).toBe(201)
      const feed = await activityOf(players.edition.id)
      expect(feed).toHaveLength(1)
      expect(feed[0]!.actor).toEqual({ id: bareAdmin.id, displayName: bareAdmin.email })
    })

    it('accepts the edition code as well as its UUID', async () => {
      const { edition } = await openEdition([])
      expect(await activityOf(edition.code)).toEqual([])
    })
  })

  describe('limit', () => {
    it.each(['0', '101', '-1', 'abc', '1.5', '', '1e1'])('rejects limit=%s with 400 VALIDATION_FAILED', async (limit) => {
      const { edition } = await openEdition([])
      const response = await asAdmin('GET', activityPath(edition.id, `?limit=${limit}`))
      expect(response.status).toBe(400)
      expect((await errorOf(response)).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
    })

    it('rejects an unknown query parameter with 400', async () => {
      const { edition } = await openEdition([])
      expect((await asAdmin('GET', activityPath(edition.id, '?offset=1'))).status).toBe(400)
    })

    it.each(['1', '20', '100'])('accepts limit=%s', async (limit) => {
      const { edition } = await openEdition([])
      expect((await asAdmin('GET', activityPath(edition.id, `?limit=${limit}`))).status).toBe(200)
    })
  })
})
