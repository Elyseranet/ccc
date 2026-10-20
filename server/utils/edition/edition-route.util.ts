import type { H3Event } from 'h3'
import type { DataSource } from 'typeorm'
import type { EditionEntity } from '../../database/entities/edition.entity'
import { getParamsWithSchema } from '../http/validation.util'
import { applyEditionCache } from './edition-cache.util'
import { editionParamsSchema } from './edition-query.util'
import { findEditionOrThrow } from './edition-read.util'

/**
 * Squelette commun des lectures publiques `/editions/{id}/…` : validation de `id` (400), édition
 * inconnue (404), cache conditionnel (304), puis construction de la réponse.
 */
export const readEditionResource = async <T>(
  event: H3Event,
  build: (dataSource: DataSource, edition: EditionEntity) => Promise<T>
): Promise<T | undefined> => {
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const dataSource = await useDataSource()
  const edition = await findEditionOrThrow(dataSource, id)
  if (await applyEditionCache(event, dataSource, edition)) {
    return undefined
  }
  return build(dataSource, edition)
}
