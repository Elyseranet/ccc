import { competitorIdParamsSchema } from '../../../utils/competitor/competitor-query.util'
import { getCompetitorDetail } from '../../../services/competitor.service'
import { getParamsWithSchema } from '../../../utils/http/validation.util'
import type { ICompetitorDetail } from '../../../../shared/interfaces/api/competitor.interface'

/** GET /api/v1/competiteurs/{id} : fiche publique (identité, historique par édition, statistiques). */
export default defineEventHandler(async (event): Promise<ICompetitorDetail> => {
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  return getCompetitorDetail(id)
})
