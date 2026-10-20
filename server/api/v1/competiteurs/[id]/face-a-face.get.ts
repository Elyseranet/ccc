import { badRequest } from '../../../../utils/http/api-error.util'
import { competitorIdParamsSchema, headToHeadQuerySchema } from '../../../../utils/competitor/competitor-query.util'
import { getHeadToHead, listHeadToHeadSummaries } from '../../../../services/competitor.service'
import { getParamsWithSchema, getQueryWithSchema } from '../../../../utils/http/validation.util'
import type { IHeadToHead, IHeadToHeadSummary } from '../../../../../shared/interfaces/api/head-to-head.interface'

/**
 * GET /api/v1/competiteurs/{id}/face-a-face?adversaire={id} : bilan et confrontations (RG36, RG37).
 * Sans `adversaire` : la liste de toutes les paires du joueur.
 */
export default defineEventHandler(async (event): Promise<IHeadToHead | IHeadToHeadSummary[]> => {
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
