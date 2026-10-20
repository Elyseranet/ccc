import type { IEditionSummary } from '../../../../shared/interfaces/api/edition.interface'
import { RATE_LIMIT_ROUTE_KEY } from '../../../consts/rate-limit.const'
import { loadAllEditionSummaries } from '../../../services/edition.service'
import { enforceRateLimit } from '../../../utils/http/rate-limit.util'

/** Les 16 éditions, de la plus récente à la plus ancienne, sans pagination (Spec API). */
export default defineEventHandler(async (event): Promise<IEditionSummary[]> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  return loadAllEditionSummaries(await useDataSource())
})
