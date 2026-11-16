import { z } from 'zod'
import { MATCH_STATUS } from '../../enums/match.enum.js'
import { SCORE_INPUT_MAX, SCORE_SIDES_MAX } from '../../consts/match-score.const.js'
import { buildMatchStatusListSchema, matchPouleSchema, matchTourSchema } from './edition.schema.js'

export const matchParamsSchema = z.object({ id: z.uuid() })

/** Score négatif, non entier ou absent : 400. `.strict()` : un champ inconnu est refusé. */
export const scoreSubmissionSchema = z.object({
  scores: z.array(z.object({
    participationId: z.uuid(),
    score: z.number().int().min(0).max(SCORE_INPUT_MAX)
  }).strict()).min(2).max(SCORE_SIDES_MAX)
}).strict()

export const adminMatchListQuerySchema = z.object({
  tour: matchTourSchema.optional(),
  poule: matchPouleSchema.optional(),
  statut: buildMatchStatusListSchema(z.enum(MATCH_STATUS)).optional()
})
