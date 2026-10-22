import { RANKING_TYPE } from '../../../../enums/ranking.enum'
import type { IRankingRow } from '../../../../interfaces/ranking.interface'
import { RATE_LIMIT_ROUTE_KEY } from '../../../../consts/rate-limit.const'
import { getRanking } from '../../../services/ranking.service'
import { enforceRateLimit } from '../../../utils/http/rate-limit.util'

export default defineEventHandler(async (event): Promise<IRankingRow[]> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  return getRanking(RANKING_TYPE.ACP)
})
