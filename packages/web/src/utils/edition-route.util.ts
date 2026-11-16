import type { H3Event } from 'h3'
import type { DataSource } from 'typeorm'
import type { EditionEntity } from '../server/db/typeorm/entities/edition.entity.js'
import { RATE_LIMIT_ROUTE_KEY } from '../consts/rate-limit.const.js'
import { enforceRateLimit } from './rate-limit.util.js'
import { getParamsWithSchema } from './validation.util.js'
import { applyEditionCache } from './edition-cache.util.js'
import { editionParamsSchema } from '../server/schemas/edition.schema.js'
import { findEditionOrThrow } from '../services/edition.service.js'
import { useDataSource } from './database.util.js'

/**
 * Squelette commun des lectures publiques `/editions/{id}/…` : budget public partagé (429), validation de `id` (400), édition
 * inconnue (404), cache conditionnel (304), puis construction de la réponse.
 */
export const readEditionResource = async <T>(
  event: H3Event,
  build: (dataSource: DataSource, edition: EditionEntity) => Promise<T>
): Promise<T | undefined> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const dataSource = await useDataSource()
  const edition = await findEditionOrThrow(dataSource, id)
  if (await applyEditionCache(event, dataSource, edition)) {
    return undefined
  }
  return build(dataSource, edition)
}
