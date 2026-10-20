import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { DataSource } from 'typeorm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildDataSourceOptions } from '../../server/database/data-source-options'
import { CompetitorEntity } from '../../server/database/entities/competitor.entity'
import { EditionEntity } from '../../server/database/entities/edition.entity'
import { ParticipationEntity } from '../../server/database/entities/participation.entity'
import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../shared/enums/edition.enum'
import type { IRankingEvolutionPoint, IRankingEvolutionSeries, IRankingRow } from '../../shared/interfaces/api/ranking.interface'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

const env = requireTestDatabaseEnv()
const CODES = ['2012a', '2012b', '2013', '2014', '2015', '2016', '2017', '2018']
const FORBIDDEN_FIELDS = ['phone', 'email', 'createdAt', 'updatedAt']

let dataSource: DataSource
let aliceId: string

describe('GET /api/v1/classements/*', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env
  })

  beforeAll(async () => {
    dataSource = new DataSource(buildDataSourceOptions({
      host: env.NUXT_DATABASE_HOST!,
      port: Number(env.NUXT_DATABASE_PORT),
      username: env.NUXT_DATABASE_USERNAME!,
      password: env.NUXT_DATABASE_PASSWORD!,
      database: env.NUXT_DATABASE_DATABASE!
    }))
    await dataSource.initialize()
    await dataSource.query('TRUNCATE participations, editions, competitors CASCADE')

    // 7 éditions clôturées (dont 2012a/2012b) + 2018 en cours
    const editions = await dataSource.getRepository(EditionEntity).save(CODES.map((code, index) => ({
      code,
      year: Number.parseInt(code, 10),
      chronologicalRank: index + 1,
      origin: EDITION_ORIGIN.APP,
      status: code === '2018' ? EDITION_STATUS.POOLS_PLAYING : EDITION_STATUS.CLOSED
    })))
    const [alice, bob] = await dataSource.getRepository(CompetitorEntity).save([
      { displayName: 'Alice', phone: '0600000000' },
      { displayName: 'Bob' }
    ])
    aliceId = alice!.id
    await dataSource.getRepository(ParticipationEntity).save([
      ...editions.map((edition) => ({
        editionId: edition.id,
        competitorId: alice!.id,
        points: edition.code === '2018' ? 99 : 10
      })),
      { editionId: editions[6]!.id, competitorId: bob!.id, points: 30 },
      { editionId: editions[4]!.id, competitorId: bob!.id, points: null }
    ])
  })

  afterAll(async () => {
    await dataSource?.destroy()
  })

  it('ACP : somme des 5 dernières éditions clôturées, sans l\'édition en cours', async () => {
    const rows = await $fetch<IRankingRow[]>('/api/v1/classements/acp')
    expect(rows.map((row) => [row.rank, row.competitor.displayName, row.points])).toEqual([
      [1, 'Alice', 50],
      [2, 'Bob', 30]
    ])
  })

  it('All Time : moyenne par participation chiffrée, points null ignorés', async () => {
    const rows = await $fetch<IRankingRow[]>('/api/v1/classements/all-time')
    expect(rows[0]).toMatchObject({ rank: 1, points: 70, participations: 7, average: 10, titles: 0 })
    expect(rows[1]).toMatchObject({ rank: 2, points: 30, participations: 1, average: 30 })
  })

  it('ne renvoie aucun champ de contact', async () => {
    const rows = await $fetch<IRankingRow[]>('/api/v1/classements/all-time')
    for (const row of rows) {
      expect(Object.keys(row.competitor).sort()).toEqual(
        ['avatarUrl', 'displayName', 'firstName', 'id', 'lastName', 'nickname']
      )
    }
    const raw = JSON.stringify(rows)
    for (const field of FORBIDDEN_FIELDS) {
      expect(raw).not.toContain(`"${field}"`)
    }
    expect(raw).not.toContain('0600000000')
  })

  it('évolution d\'un joueur', async () => {
    const points = await $fetch<IRankingEvolutionPoint[]>(
      `/api/v1/classements/evolution?competiteur=${aliceId}&type=all-time`
    )
    expect(points.map((point) => point.points)).toEqual([10, 20, 30, 40, 50, 60, 70])
    expect(points.map((point) => point.editionCode)).not.toContain('2018')
  })

  it('évolution de tous les joueurs en un seul appel (C5)', async () => {
    const series = await $fetch<IRankingEvolutionSeries[]>('/api/v1/classements/evolution?type=acp')
    expect(series.map((entry) => entry.competitor.displayName)).toEqual(['Alice', 'Bob'])
    expect(series[0]!.points).toHaveLength(7)
  })

  it('type hors enum ou absent : 400 VALIDATION_FAILED', async () => {
    for (const path of ['/api/v1/classements/evolution?type=nope', '/api/v1/classements/evolution']) {
      const response = await fetch(path)
      expect(response.status).toBe(400)
      expect((await response.json()).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
    }
  })

  it('competiteur mal formé : 400 ; inconnu : 404', async () => {
    const malformed = await fetch('/api/v1/classements/evolution?type=acp&competiteur=abc')
    expect(malformed.status).toBe(400)
    const unknown = await fetch(
      '/api/v1/classements/evolution?type=acp&competiteur=00000000-0000-4000-8000-000000000000'
    )
    expect(unknown.status).toBe(404)
    expect((await unknown.json()).code).toBe(API_ERROR_CODE.NOT_FOUND)
  })
})
