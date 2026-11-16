import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { loadEditionSummaries } from '../../src/services/edition.service'
import { seedArchives } from './helpers/archives'
import { cleanup, resetSchema } from './helpers/test-database'

let dataSource: DataSource

/** Compte les requêtes SQL émises pendant `work` (le logger du DataSource est lu à chaque requête). */
const countQueries = async (work: () => Promise<unknown>): Promise<number> => {
  let count = 0
  const original = dataSource.logger
  ;(dataSource as { logger: unknown }).logger = {
    logQuery: () => { count += 1 },
    logQueryError: () => {},
    logQuerySlow: () => {},
    logSchemaBuild: () => {},
    logMigration: () => {},
    log: () => {}
  }
  try {
    await work()
  } finally {
    ;(dataSource as { logger: unknown }).logger = original
  }
  return count
}

beforeAll(async () => {
  dataSource = await resetSchema()
  await seedArchives(dataSource)
})

afterAll(cleanup)

describe('IEditionSummary.final (G4)', () => {
  it('is computed in one pass: the number of queries does not depend on the number of editions', async () => {
    const editions = await dataSource.getRepository(EditionEntity).find({ order: { chronologicalRank: 'ASC' } })
    expect(editions).toHaveLength(16)

    const forOne = await countQueries(() => loadEditionSummaries(dataSource, editions.slice(0, 1)))
    const forAll = await countQueries(() => loadEditionSummaries(dataSource, editions))
    expect(forAll).toBe(forOne)
  })

  it('gives every real edition a runner-up', async () => {
    const editions = await dataSource.getRepository(EditionEntity).find()
    const summaries = await loadEditionSummaries(dataSource, editions)
    expect(summaries.filter((summary) => summary.final?.runnerUp)).toHaveLength(16)
  })
})

describe('podium titles and semi-finalists (B-19)', () => {
  const titlesAt = async (competitorId: string, rank: number): Promise<number> => Number((await dataSource.query(
    `SELECT count(*) AS n FROM participations p JOIN editions e ON e.id = p.edition_id
      WHERE p.competitor_id = $1 AND p.final_stage = 'CHAMPION' AND e.chronological_rank <= $2`,
    [competitorId, rank]
  ))[0].n)

  it('real archive: titles to date of the champion, the runner-up and both semi-finalists equal the direct SQL count', async () => {
    const editions = await dataSource.getRepository(EditionEntity).find()
    const summaries = await loadEditionSummaries(dataSource, editions)
    for (const summary of summaries) {
      const rank = editions.find((edition) => edition.id === summary.id)!.chronologicalRank
      expect(summary.champion!.titlesToDate, summary.code).toBe(await titlesAt(summary.champion!.competitor.id, rank))
      expect(summary.final!.runnerUpTitlesToDate, summary.code).toBe(await titlesAt(summary.final!.runnerUp.id, rank))
      expect(summary.semiFinalists, summary.code).toHaveLength(2)
      for (const entry of summary.semiFinalists) {
        expect(entry.titlesToDate, `${summary.code} ${entry.competitor.displayName}`).toBe(await titlesAt(entry.competitor.id, rank))
      }
    }
  })

  it('real archive: semi-finalists follow the sequence of their semi-final', async () => {
    const editions = await dataSource.getRepository(EditionEntity).find()
    const summaries = await loadEditionSummaries(dataSource, editions)
    for (const summary of summaries) {
      const rows = await dataSource.query<Array<{ competitor_id: string, sequence: number }>>(
        `SELECT p.competitor_id, min(m.sequence) AS sequence
           FROM participations p
           JOIN match_sides s ON s.participation_id = p.id
           JOIN matches m ON m.id = s.match_id
           JOIN rounds r ON r.id = m.round_id
          WHERE p.edition_id = $1 AND p.final_stage = 'SEMI' AND r.kind = 'SEMI'
          GROUP BY p.competitor_id`,
        [summary.id]
      )
      const bySequence = new Map(rows.map((row) => [row.competitor_id, Number(row.sequence)]))
      const sequences = summary.semiFinalists.map((entry) => bySequence.get(entry.competitor.id))
      expect(sequences.every((sequence) => sequence !== undefined), summary.code).toBe(true)
      expect(sequences, summary.code).toEqual([...sequences].sort((a, b) => a! - b!))
    }
  })
})
