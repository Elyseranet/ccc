import { z } from 'zod'
import { RANKING_TYPE } from '../../enums/ranking.enum'

export const rankingEvolutionQuerySchema = z.object({
  type: z.enum(RANKING_TYPE),
  competiteur: z.uuid().optional()
})
