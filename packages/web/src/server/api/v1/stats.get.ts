import type { IArchiveStats } from '../../../interfaces/stats.interface'
import { RATE_LIMIT_ROUTE_KEY } from '../../../consts/rate-limit.const'
import { loadArchiveStats } from '../../../services/edition.service'
import { enforceRateLimit } from '../../../utils/rate-limit.util'
import { useDataSource } from '../../../utils/database.util'

export default defineEventHandler(async (event): Promise<IArchiveStats> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  return loadArchiveStats(await useDataSource())
})
