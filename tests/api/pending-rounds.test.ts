import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import { MATCH_STATUS } from '../../src/enums/match.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IAdminMatch } from '../../src/interfaces/admin-match.interface'
import type { ICompetitorDetail } from '../../src/interfaces/competitor.interface'
import type { IEditionDetail, IEditionSummary } from '../../src/interfaces/edition.interface'
import type { IMatch } from '../../src/interfaces/match.interface'
import type { IPaginated } from '../../src/interfaces/pagination.interface'
import type { IRound } from '../../src/interfaces/round.interface'
import type { IArchiveStats } from '../../src/interfaces/stats.interface'
import { MatchSideEntity } from '../../src/server/db/typeorm/entities/match-side.entity'
import { MatchEntity } from '../../src/server/db/typeorm/entities/match.entity'
import { RoundEntity } from '../../src/server/db/typeorm/entities/round.entity'
import { cookieHeaderOf, login, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { seedKnockoutEdition } from './helpers/seed-scoring'
import { requireTestDatabaseEnv } from './helpers/test-database'

const env = requireTestDatabaseEnv()

/*********************************************************
 * Tours non tirés (B-18)
 *
 * @description
 * Un tour `PENDING` et ses matchs ne sortent d'aucune lecture publique. Le jeu de test pose une phase finale
 * (demi-finales validées, finale) puis fait varier le statut du tour de la finale.
 ********************************************************/
describe('B-18: PENDING rounds are not public', async () => {
  Object.assign(process.env, env)
  const { default: dataSource } = await import('../../src/server/db/typeorm/data-source')
  await dataSource.initialize()
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
  const knockout = await seedKnockoutEdition(dataSource, { code: '2031', year: 2031, chronologicalRank: 1, withFinalDraw: false })
  const admin = await seedUser(dataSource, { email: 'admin-b18@example.test', password: 'Sup3r-secret-b18!', role: USER_ROLE.ADMIN })

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

  const id = knockout.edition.id
  const setFinalRound = (status: ROUND_STATUS) => dataSource.getRepository(RoundEntity).update({ id: knockout.finalRound.id }, { status })
  const getJson = async <T>(path: string, headers: Record<string, string> = {}): Promise<T> => {
    const response = await fetch(path, { headers })
    expect(response.status, path).toBe(200)
    return await response.json() as T
  }
  const kinds = (rounds: Array<{ kind: ROUND_KIND }>): ROUND_KIND[] => rounds.map((round) => round.kind)

  it.each([ROUND_STATUS.DRAWN, ROUND_STATUS.PLAYING, ROUND_STATUS.COMPLETED])('publishes a %s round and its matches as before', async (status) => {
    await setFinalRound(status)
    const detail = await getJson<IEditionDetail>(`/api/v1/editions/${id}`)
    expect(kinds(detail.rounds)).toEqual([ROUND_KIND.SEMI, ROUND_KIND.FINAL])
    expect(kinds(detail.bracket)).toEqual([ROUND_KIND.SEMI, ROUND_KIND.FINAL])
    expect(detail.matches).toHaveLength(3)
    expect(detail.matchCount).toBe(3)
    expect((await getJson<IPaginated<IMatch>>(`/api/v1/editions/${id}/matchs`)).total).toBe(3)
    expect(kinds(await getJson<IRound[]>(`/api/v1/editions/${id}/tours`))).toEqual([ROUND_KIND.SEMI, ROUND_KIND.FINAL])
  })

  it('hides a PENDING round and its matches everywhere in the public API', async () => {
    // Un match validé dans un tour non tiré (état de test ou donnée reprise) ne compte nulle part non plus.
    await dataSource.getRepository(MatchEntity).update({ id: knockout.final.id }, { status: MATCH_STATUS.VALIDATED, validatedAt: new Date() })
    await dataSource.getRepository(MatchSideEntity).update({ matchId: knockout.final.id, position: 1 }, { validatedScore: 10 })
    await dataSource.getRepository(MatchSideEntity).update({ matchId: knockout.final.id, position: 2 }, { validatedScore: 9 })
    const competitorId = knockout.participations[0]!.competitorId
    await setFinalRound(ROUND_STATUS.DRAWN)
    expect((await getJson<ICompetitorDetail>(`/api/v1/competiteurs/${competitorId}`)).stats.wins).toBe(2)

    await setFinalRound(ROUND_STATUS.PENDING)
    const detail = await getJson<IEditionDetail>(`/api/v1/editions/${id}`)
    expect(kinds(detail.rounds)).toEqual([ROUND_KIND.SEMI])
    expect(kinds(detail.bracket)).toEqual([ROUND_KIND.SEMI])
    expect(detail.matches.map((match) => match.sequence)).toEqual([1, 2])
    expect(detail.matchCount).toBe(2)
    expect(detail.scoredMatchCount).toBe(2)
    expect(detail.final).toBeNull()

    const list = await getJson<IPaginated<IMatch>>(`/api/v1/editions/${id}/matchs`)
    expect(list.total).toBe(2)
    expect((await getJson<IPaginated<IMatch>>(`/api/v1/editions/${id}/matchs?tour=FINAL`)).total).toBe(0)
    expect((await getJson<IPaginated<IMatch>>(`/api/v1/editions/${id}/matchs?statut=VALIDATED`)).total).toBe(2)
    expect(kinds(await getJson<IRound[]>(`/api/v1/editions/${id}/tours`))).toEqual([ROUND_KIND.SEMI])

    const summaries = await getJson<IEditionSummary[]>('/api/v1/editions')
    expect(summaries.find((summary) => summary.id === id)).toMatchObject({ matchCount: 2, scoredMatchCount: 2 })
    expect(await getJson<IArchiveStats>('/api/v1/stats')).toMatchObject({ matches: 2, scoredMatches: 2 })
    expect((await getJson<ICompetitorDetail>(`/api/v1/competiteurs/${competitorId}`)).stats.wins).toBe(1)
  })

  it('does not apply the public filter to the admin match list', async () => {
    const cookie = cookieHeaderOf(await login(admin.email, admin.password))
    const matches = await getJson<IAdminMatch[]>(`/api/v1/admin/editions/${id}/matchs`, { Cookie: cookie })
    expect(matches.map((match) => match.sequence)).toEqual([1, 2, 3])
  })

  it('changes the ETag when a round goes from PENDING to DRAWN', async () => {
    await setFinalRound(ROUND_STATUS.PENDING)
    const path = `/api/v1/editions/${id}`
    const before = await fetch(path)
    const etag = before.headers.get('etag')!
    expect((await fetch(path, { headers: { 'If-None-Match': etag } })).status).toBe(304)

    await setFinalRound(ROUND_STATUS.DRAWN)
    const after = await fetch(path, { headers: { 'If-None-Match': etag } })
    expect(after.status).toBe(200)
    expect(after.headers.get('etag')).not.toBe(etag)
  })
})
