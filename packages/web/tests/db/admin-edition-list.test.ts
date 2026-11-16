import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { loadAllAdminEditionSummaries } from '../../src/services/edition.service'
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

const addEdition = (rank: number) => dataSource.getRepository(EditionEntity).save({
  code: `${3000 + rank}`, year: 3000 + rank, chronologicalRank: rank, status: EDITION_STATUS.REGISTRATION, origin: EDITION_ORIGIN.APP
})

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(cleanup)

describe('loadAllAdminEditionSummaries (B-20)', () => {
  it('is empty without edition', async () => {
    expect(await loadAllAdminEditionSummaries(dataSource)).toEqual([])
  })

  it('counts the registrants of each edition in one grouped query: the number of queries does not depend on the number of editions', async () => {
    const player = await dataSource.getRepository(CompetitorEntity).save({ displayName: 'Compteur' })
    const first = await addEdition(1)
    await dataSource.getRepository(ParticipationEntity).save({ editionId: first.id, competitorId: player.id })
    const forOne = await countQueries(() => loadAllAdminEditionSummaries(dataSource))

    for (let rank = 2; rank <= 9; rank += 1) {
      const edition = await addEdition(rank)
      if (rank % 2 === 0) {
        await dataSource.getRepository(ParticipationEntity).save({ editionId: edition.id, competitorId: player.id })
      }
    }
    const forNine = await countQueries(() => loadAllAdminEditionSummaries(dataSource))
    expect(forNine).toBe(forOne)

    const list = await loadAllAdminEditionSummaries(dataSource)
    expect(list).toHaveLength(9)
    expect(list.map((edition) => edition.registeredCount)).toEqual([0, 1, 0, 1, 0, 1, 0, 1, 1])
  })
})
