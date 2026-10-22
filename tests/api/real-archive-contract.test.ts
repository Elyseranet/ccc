import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { ICompetitorDetail, ICompetitorListItem } from '../../src/interfaces/competitor.interface'
import type { IEditionSummary } from '../../src/interfaces/edition.interface'
import type { IHeadToHead, IHeadToHeadSummary } from '../../src/interfaces/head-to-head.interface'
import type { IPaginated } from '../../src/interfaces/pagination.interface'
import { seedArchives } from '../db/helpers/archives'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const env = requireTestDatabaseEnv()
const REAL_EDITION_COUNT = 16
/** Bilan global de Nicolas Deseine sur l'archive réelle (critère G2 de B-17). */
const DESEINE_WINS = 39
const DESEINE_LOSSES = 13

describe('B-17 contract on the real archive', async () => {
  Object.assign(process.env, env)
  const { default: dataSource } = await import('../../src/server/db/typeorm/data-source')
  await dataSource.initialize()
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
  await seedArchives(dataSource)

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
  const deseineId = async (): Promise<string> => {
    const rows = await dataSource.query<Array<{ id: string }>>(`SELECT id FROM competitors WHERE display_name = 'Nicolas Deseine'`)
    expect(rows).toHaveLength(1)
    return rows[0]!.id
  }

  it('G2: Deseine editions add up to the global 39/13, and match a direct count in the database', async () => {
    const id = await deseineId()
    const detail = await getJson<ICompetitorDetail>(`/api/v1/competiteurs/${id}`)
    expect([detail.stats.wins, detail.stats.losses]).toEqual([DESEINE_WINS, DESEINE_LOSSES])
    expect(detail.participations.reduce((total, p) => total + p.wins, 0)).toBe(DESEINE_WINS)
    expect(detail.participations.reduce((total, p) => total + p.losses, 0)).toBe(DESEINE_LOSSES)

    const rows = await dataSource.query<Array<{ code: string, wins: string, losses: string, unknown: string }>>(
      `SELECT e.code,
              count(*) FILTER (WHERE m.status = 'VALIDATED' AND ms.validated_score > o.validated_score) AS wins,
              count(*) FILTER (WHERE m.status = 'VALIDATED' AND ms.validated_score < o.validated_score) AS losses,
              count(*) FILTER (WHERE m.status = 'RESULT_UNKNOWN') AS unknown
         FROM match_sides ms
         JOIN participations p ON p.id = ms.participation_id
         JOIN matches m ON m.id = ms.match_id
         JOIN editions e ON e.id = m.edition_id
         JOIN match_sides o ON o.match_id = m.id AND o.id <> ms.id
        WHERE p.competitor_id = $1 AND m.purpose = 'REGULAR' AND m.status IN ('VALIDATED', 'RESULT_UNKNOWN')
        GROUP BY e.code`,
      [id]
    )
    const direct = new Map(rows.map((row) => [row.code, [Number(row.wins), Number(row.losses), Number(row.unknown)]]))
    for (const participation of detail.participations) {
      expect([participation.wins, participation.losses, participation.unknownResults], participation.editionCode)
        .toEqual(direct.get(participation.editionCode) ?? [0, 0, 0])
    }
    const withPool = await dataSource.query<Array<{ code: string, number: number | null, place: number | null }>>(
      `SELECT e.code, po.rank AS number, p.pool_rank AS place
         FROM participations p JOIN editions e ON e.id = p.edition_id LEFT JOIN pools po ON po.id = p.pool_id
        WHERE p.competitor_id = $1`,
      [id]
    )
    for (const row of withPool) {
      const participation = detail.participations.find((item) => item.editionCode === row.code)!
      expect([participation.poolNumber, participation.poolRank], row.code).toEqual([row.number, row.place])
    }
  })

  it('G3: the titles of every opponent equal the ones of the competitor list', async () => {
    const id = await deseineId()
    const list = await getJson<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs?pageSize=100&page=1')
    const second = await getJson<IPaginated<ICompetitorListItem>>('/api/v1/competiteurs?pageSize=100&page=2')
    const titles = new Map([...list.items, ...second.items].map((item) => [item.id, item.titles]))
    const pairs = await getJson<IHeadToHeadSummary[]>(`/api/v1/competiteurs/${id}/face-a-face`)
    expect(pairs.length).toBeGreaterThan(0)
    for (const pair of pairs) {
      expect(pair.opponent.titles, pair.opponent.displayName).toBe(titles.get(pair.opponent.id))
    }
  })

  it('G9, G10: unknownResults equals the direct count, and played + unknownResults is every REGULAR match of the pair', async () => {
    const pairRows = await dataSource.query<Array<{ a: string, b: string, unknown: string }>>(
      `SELECT pa.competitor_id AS a, pb.competitor_id AS b, count(*) AS unknown
         FROM matches m
         JOIN match_sides sa ON sa.match_id = m.id AND sa.position = 1
         JOIN match_sides sb ON sb.match_id = m.id AND sb.position = 2
         JOIN participations pa ON pa.id = sa.participation_id
         JOIN participations pb ON pb.id = sb.participation_id
        WHERE m.purpose = 'REGULAR' AND m.status = 'RESULT_UNKNOWN'
        GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 5`
    )
    expect(pairRows.length).toBeGreaterThan(0)
    for (const row of pairRows) {
      const total = await dataSource.query<Array<{ n: string, unknown: string }>>(
        `SELECT count(*) AS n, count(*) FILTER (WHERE m.status = 'RESULT_UNKNOWN') AS unknown
           FROM matches m
           JOIN match_sides sa ON sa.match_id = m.id
           JOIN match_sides sb ON sb.match_id = m.id AND sb.id <> sa.id
           JOIN participations pa ON pa.id = sa.participation_id
           JOIN participations pb ON pb.id = sb.participation_id
          WHERE m.purpose = 'REGULAR' AND m.status IN ('VALIDATED', 'RESULT_UNKNOWN')
            AND pa.competitor_id = $1 AND pb.competitor_id = $2`,
        [row.a, row.b]
      )
      const pair = await getJson<IHeadToHead>(`/api/v1/competiteurs/${row.a}/face-a-face?adversaire=${row.b}`)
      expect(pair.unknownResults).toBe(Number(total[0]!.unknown))
      expect(pair.played + pair.unknownResults).toBe(Number(total[0]!.n))
      expect(pair.unknownResults).toBeGreaterThan(0)
      for (const match of pair.matches) {
        expect(match.poolNumber === null || Number.isInteger(match.poolNumber)).toBe(true)
      }
    }
  })

  it('G4: the 16 editions all have a runner-up, and the final score exists only when the final has one', async () => {
    const editions = await getJson<IEditionSummary[]>('/api/v1/editions')
    expect(editions).toHaveLength(REAL_EDITION_COUNT)
    for (const edition of editions) {
      expect(edition.final?.runnerUp, edition.code).toBeTruthy()
    }
    const scored = await dataSource.query<Array<{ code: string }>>(
      `SELECT DISTINCT e.code
         FROM matches m JOIN rounds r ON r.id = m.round_id JOIN editions e ON e.id = m.edition_id
        WHERE r.kind = 'FINAL' AND m.status = 'VALIDATED'`
    )
    const expectedWithScore = new Set(scored.map((row) => row.code))
    for (const edition of editions) {
      if (edition.final!.score === null) {
        // Pas de score : soit aucune finale validée, soit les côtés ne correspondent pas aux deux finalistes.
        continue
      }
      expect(expectedWithScore.has(edition.code), edition.code).toBe(true)
      expect(edition.final!.score.champion, edition.code).toBe(10)
      expect(edition.final!.score.runnerUp, edition.code).toBeLessThan(10)
    }
    expect(editions.filter((edition) => edition.final!.score !== null).length).toBeGreaterThan(0)
  })
})
