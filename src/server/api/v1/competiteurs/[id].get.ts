import { RATE_LIMIT_ROUTE_KEY } from '../../../../consts/rate-limit.const'
import { competitorIdParamsSchema } from '../../../../schemas/competitor.schema'
import { getCompetitorDetail } from '../../../../services/competitor.service'
import { enforceRateLimit } from '../../../../utils/rate-limit.util'
import { getParamsWithSchema } from '../../../../utils/validation.util'
import type { ICompetitorDetail } from '../../../../interfaces/competitor.interface'

/** GET /api/v1/competiteurs/{id} : fiche publique (identité, historique par édition, statistiques). */
export default defineEventHandler(async (event): Promise<ICompetitorDetail> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  return getCompetitorDetail(id)
})
