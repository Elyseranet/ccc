import type { IArchiveStats } from '../../../shared/interfaces/api/stats.interface'
import { RATE_LIMIT_ROUTE_KEY } from '../../consts/rate-limit.const'
import { loadArchiveStats } from '../../services/edition.service'
import { enforceRateLimit } from '../../utils/http/rate-limit.util'

export default defineEventHandler(async (event): Promise<IArchiveStats> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  return loadArchiveStats(await useDataSource())
})
