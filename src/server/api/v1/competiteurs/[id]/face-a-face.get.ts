import { RATE_LIMIT_ROUTE_KEY } from '../../../../../consts/rate-limit.const'
import { badRequest } from '../../../../../utils/api-error.util'
import { competitorIdParamsSchema, headToHeadQuerySchema } from '../../../../../schemas/competitor.schema'
import { getHeadToHead, listHeadToHeadSummaries } from '../../../../../services/competitor.service'
import { enforceRateLimit } from '../../../../../utils/rate-limit.util'
import { getParamsWithSchema, getQueryWithSchema } from '../../../../../utils/validation.util'
import type { IHeadToHead, IHeadToHeadSummary } from '../../../../../interfaces/head-to-head.interface'

/**
 * GET /api/v1/competiteurs/{id}/face-a-face?adversaire={id} : bilan et confrontations (RG36, RG37).
 * Sans `adversaire` : la liste de toutes les paires du joueur.
 */
export default defineEventHandler(async (event): Promise<IHeadToHead | IHeadToHeadSummary[]> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  const { adversaire } = await getQueryWithSchema(event, headToHeadQuerySchema)

  if (adversaire === undefined) {
    return listHeadToHeadSummaries(id)
  }
  if (adversaire === id) {
    throw badRequest()
  }
  return getHeadToHead(id, adversaire)
})
