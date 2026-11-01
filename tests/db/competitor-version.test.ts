import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { COMPETITOR_KEEP_VERSION } from '../../src/consts/competitor.const'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { cleanup, resetSchema } from './helpers/test-database'

let dataSource: DataSource

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(cleanup)

/** Le SQL réellement généré par TypeORM pour un `update` du dépôt, sans l'exécuter. */
const updateSql = (values: Record<string, unknown>): string =>
  dataSource.getRepository(CompetitorEntity).createQueryBuilder().update().set(values).where('id = :id', { id: 'x' }).getQuery()

describe('competitors.version (T-SEC-08, T-SEC-10 L1)', () => {
  it('starts at 1 and is incremented by TypeORM on an ordinary update (identity change)', async () => {
    const competitor = await dataSource.getRepository(CompetitorEntity).save({ displayName: 'Version Un' })
    expect(competitor.version).toBe(1)
    expect(updateSql({ displayName: 'Autre' })).toMatch(/"version" = "version" \+ 1/)
    await dataSource.getRepository(CompetitorEntity).update({ id: competitor.id }, { displayName: 'Version Deux' })
    expect((await dataSource.getRepository(CompetitorEntity).findOneByOrFail({ id: competitor.id })).version).toBe(2)
  })

  it('does not increment the version when it is fixed explicitly (avatar, phone): the generated SQL keeps the column', async () => {
    const sql = updateSql({ updatedAt: () => 'CURRENT_TIMESTAMP', version: COMPETITOR_KEEP_VERSION })
    expect(sql).toContain('"version" = "version"')
    expect(sql).not.toMatch(/"version" = "version" \+ 1/)
    expect((sql.match(/"version"/g) ?? []).length).toBe(2)

    const competitor = await dataSource.getRepository(CompetitorEntity).save({ displayName: 'Version Fixe' })
    await dataSource.getRepository(CompetitorEntity).update({ id: competitor.id }, { updatedAt: () => 'CURRENT_TIMESTAMP', version: COMPETITOR_KEEP_VERSION })
    await dataSource.getRepository(CompetitorEntity).update({ id: competitor.id }, { phone: '+33 6 00 00 00 00', version: COMPETITOR_KEEP_VERSION })
    expect((await dataSource.getRepository(CompetitorEntity).findOneByOrFail({ id: competitor.id })).version).toBe(1)
  })
})
