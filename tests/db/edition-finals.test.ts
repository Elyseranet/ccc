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
