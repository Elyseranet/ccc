import { RATE_LIMIT_ROUTE_KEY } from '../../../consts/rate-limit.const'
import { competitorIdParamsSchema } from '../../../utils/competitor/competitor-query.util'
import { getCompetitorDetail } from '../../../services/competitor.service'
import { enforceRateLimit } from '../../../utils/http/rate-limit.util'
import { getParamsWithSchema } from '../../../utils/http/validation.util'
import type { ICompetitorDetail } from '../../../../shared/interfaces/api/competitor.interface'

/** GET /api/v1/competiteurs/{id} : fiche publique (identité, historique par édition, statistiques). */
export default defineEventHandler(async (event): Promise<ICompetitorDetail> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  return getCompetitorDetail(id)
})
