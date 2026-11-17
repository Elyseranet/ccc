import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../enums/user.enum'
import { RATE_LIMIT_ROUTE_KEY } from '../../../../consts/rate-limit.const'
import { competitorIdParamsSchema } from '../../../schemas/competitor.schema'
import { getCompetitorDetail } from '../../../../services/competitor.service'
import { enforceRateLimit } from '../../../../utils/rate-limit.util'
import { getParamsWithSchema } from '../../../../utils/validation.util'
import type { ICompetitorDetail } from '../../../../interfaces/competitor.interface'

/**
 * GET /api/v1/competiteurs/{id} : fiche publique (identité, historique par édition, statistiques). Pour un administrateur
 * connecté (B-29), la réponse porte en plus `account` (état, email, expiration de l'invitation) et n'est jamais mise en cache.
 */
export default defineEventHandler(async (event): Promise<ICompetitorDetail> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  const isAdmin = event.context.user?.role === USER_ROLE.ADMIN
  if (isAdmin) {
    setResponseHeader(event, 'Cache-Control', 'no-store')
  }
  return getCompetitorDetail(id, isAdmin)
})
