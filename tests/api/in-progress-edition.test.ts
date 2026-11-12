import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import { EDITION_STATUS } from '../../src/enums/edition.enum'
import { MATCH_STATUS } from '../../src/enums/match.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import type { IEditionDetail, IEditionSummary } from '../../src/interfaces/edition.interface'
import type { IMatch } from '../../src/interfaces/match.interface'
import type { IPaginated } from '../../src/interfaces/pagination.interface'
import { E2E_IN_PROGRESS_EDITION_CODE } from '../e2e/helpers/e2e.const'
import { readInProgressEditionState, rewindEditionToPoolsPhase } from '../e2e/helpers/in-progress-edition'
import { seedArchives } from '../db/helpers/archives'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const env = requireTestDatabaseEnv()
/** Taille de page maximale de l'API publique. */
const MATCHES_PAGE_SIZE = 100

/*********************************************************
 * 2026 en phase de poules, vu par l'API publique (QA-2, T-QA-03, B-18)
 *
 * @description
 * Archives réelles, puis la remise en phase de poules du jeu de test e2e. Un tour PENDING et ses matchs ne sortent d'aucune
 * lecture publique (B-18) : le tour de poules doit donc être PLAYING pour que les poules et leurs matchs restent publiés, et
 * aucun tour de phase finale ni match de phase finale ne doit apparaître.
 ********************************************************/
describe('T-QA-03: la 2026 en phase de poules est publiée par l’API', async () => {
  Object.assign(process.env, env)
  const { default: dataSource } = await import('../../src/server/db/typeorm/data-source')
  await dataSource.initialize()
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
  await seedArchives(dataSource)
  const state = await rewindEditionToPoolsPhase(dataSource)

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.dropDatabase()
      await dataSource.runMigrations()
      await dataSource.destroy()
    }
  })

  const getJson = async <T>(path: string): Promise<T> => {
    const response = await fetch(path)
    expect(response.status, path).toBe(200)
    return await response.json() as T
  }
  const currentId = async (): Promise<string> => {
    const editions = await getJson<IEditionSummary[]>('/api/v1/editions')
    const current = editions.find(edition => edition.code === E2E_IN_PROGRESS_EDITION_CODE)
    expect(current?.status).toBe(EDITION_STATUS.POOLS_PLAYING)
    return current!.id
  }

  it('GET /editions/{id} : le tour de poules est publié (PLAYING), aucun tour de phase finale, pas de tableau', async () => {
    const detail = await getJson<IEditionDetail>(`/api/v1/editions/${await currentId()}`)
    expect(detail.rounds.map(round => round.kind)).toEqual([ROUND_KIND.POOLS])
    expect(detail.rounds[0]!.status).toBe(ROUND_STATUS.PLAYING)
    expect(detail.bracket).toEqual([])
  })

  it('GET /editions/{id} : les poules sont publiées, avec leurs matchs, dont la part encore à jouer', async () => {
    const detail = await getJson<IEditionDetail>(`/api/v1/editions/${await currentId()}`)
    expect(detail.pools.length).toBeGreaterThan(0)
    const pools = detail.rounds[0]!
    expect(pools.matchCount).toBe(state.matches.poolValidated + state.matches.poolRecorded + state.matches.poolScheduled)
    expect(pools.validatedMatchCount).toBe(state.matches.poolValidated)
  })

  it('GET /editions/{id}/matchs : uniquement des matchs de poule, les matchs à jouer y sont, sans score', async () => {
    const id = await currentId()
    const first = await getJson<IPaginated<IMatch>>(`/api/v1/editions/${id}/matchs?pageSize=${MATCHES_PAGE_SIZE}`)
    const items = [...first.items]
    for (let page = 2; items.length < first.total; page++) {
      items.push(...(await getJson<IPaginated<IMatch>>(`/api/v1/editions/${id}/matchs?pageSize=${MATCHES_PAGE_SIZE}&page=${page}`)).items)
    }
    expect(items).toHaveLength(first.total)
    expect(items.length).toBeGreaterThan(0)
    expect(items.every(match => match.roundKind === ROUND_KIND.POOLS)).toBe(true)
    const scheduled = items.filter(match => match.status === MATCH_STATUS.SCHEDULED)
    // Un match saisi n'est pas public (« saisir n'est pas valider ») : l'API le publie à jouer, sans score.
    expect(scheduled).toHaveLength(state.matches.poolScheduled + state.matches.poolRecorded)
    expect(scheduled.every(match => match.sides.every(side => side.score === null))).toBe(true)
  })

  it('l’état relu en base est celui que l’API publie', async () => {
    expect(await readInProgressEditionState(dataSource)).toEqual(state)
  })
})
