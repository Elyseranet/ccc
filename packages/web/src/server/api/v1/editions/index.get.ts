import type { IEditionSummary } from '../../../../interfaces/edition.interface'
import { RATE_LIMIT_ROUTE_KEY } from '../../../../consts/rate-limit.const'
import { loadAllEditionSummaries } from '../../../../services/edition.service'
import { enforceRateLimit } from '../../../../utils/rate-limit.util'
import { useDataSource } from '../../../../utils/database.util'

/** Les 16 éditions, de la plus récente à la plus ancienne, sans pagination (Spec API). */
export default defineEventHandler(async (event): Promise<IEditionSummary[]> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  return loadAllEditionSummaries(await useDataSource())
})
