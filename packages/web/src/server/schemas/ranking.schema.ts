import { z } from 'zod'
import { RANKING_KIND } from '../../enums/ranking-kind.enum.js'

export const rankingEvolutionQuerySchema = z.object({
  type: z.enum(RANKING_KIND),
  competiteur: z.uuid().optional()
})
