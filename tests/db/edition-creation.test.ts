import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { createEdition } from '../../src/services/edition.service'
import { cleanup, resetSchema } from './helpers/test-database'

let dataSource: DataSource

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(async () => {
  await cleanup()
})

const nextRank = async (): Promise<number> => {
  const { max } = (await dataSource.getRepository(EditionEntity).createQueryBuilder('e')
    .select('MAX(e.chronologicalRank)', 'max').getRawOne<{ max: number | null }>())!
  return (max ?? 0) + 1
}

describe('createEdition: collision hors verrou', () => {
  /**
   * Une transaction concurrente insère, sans passer par le verrou, l'édition que `createEdition` va calculer, et ne
   * valide qu'après. `createEdition` ne voit pas cette ligne non validée, calcule le même code et le même rang, puis
   * attend sur l'index unique : au commit, PostgreSQL lève 23505, que le service doit traduire en 409.
   */
  it('turns a unique violation on the computed code or rank into a 409 EDITION_CONFLICT', async () => {
    const rank = await nextRank()
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    await queryRunner.manager.getRepository(EditionEntity).save({
      code: '2060', year: 2060, chronologicalRank: rank, origin: EDITION_ORIGIN.APP, status: EDITION_STATUS.CREATED
    })

    const creation = createEdition(dataSource, { year: 2060, name: 'Concurrente' })
    const outcome = creation.then(() => null, (error: unknown) => error)
    await new Promise((resolve) => setTimeout(resolve, 500))
    await queryRunner.commitTransaction()
    await queryRunner.release()

    const error = await outcome as { statusCode: number, data: { code: string } } | null
    expect(error).not.toBeNull()
    expect(error!.statusCode).toBe(409)
    expect(error!.data.code).toBe(API_ERROR_CODE.EDITION_CONFLICT)
    expect(await dataSource.getRepository(EditionEntity).countBy({ year: 2060 })).toBe(1)
  })

  it('keeps one global lock: simultaneous creations in different years get distinct ranks', async () => {
    const created = await Promise.all([2061, 2062, 2063, 2064].map((year) => createEdition(dataSource, { year, name: `y${year}` })))
    expect(new Set(created.map((edition) => edition.chronologicalRank)).size).toBe(4)
    expect(created.map((edition) => edition.code).sort()).toEqual(['2061', '2062', '2063', '2064'])
  })
})
