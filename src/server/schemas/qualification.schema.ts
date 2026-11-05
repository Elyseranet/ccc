import { z } from 'zod'
import { DRAW_ASSIGNMENTS_MAX } from '../../consts/draw.const.js'
import { QUALIFICATION_BEST_NEXT_MAX, QUALIFICATION_TOP_PER_POOL_MAX, TIEBREAK_PLAYERS_MAX } from '../../consts/qualification.const.js'
import { ROUND_KIND } from '../../enums/round.enum.js'

const topPerPoolSchema = z.number().int().min(1).max(QUALIFICATION_TOP_PER_POOL_MAX)
const bestNextCountSchema = z.number().int().min(0).max(QUALIFICATION_BEST_NEXT_MAX)

/** Corps de `POST /editions/{id}/qualification`. Les bornes liées à l'édition (plus grande poule, nombre de poules) sont vérifiées par le service. */
export const qualificationParametersSchema = z.object({
  topPerPool: topPerPoolSchema,
  bestNextCount: bestNextCountSchema,
  withPlayoff: z.boolean()
}).strict()

const queryInteger = (schema: z.ZodNumber) => z.string().regex(/^\d{1,3}$/, 'Expected a non-negative integer').transform(Number).pipe(schema)

/** `?topPerPool=&bestNextCount=` : les deux ou aucun, jamais un seul. */
export const qualificationQuerySchema = z.object({
  topPerPool: queryInteger(z.number().int().min(1).max(QUALIFICATION_TOP_PER_POOL_MAX)).optional(),
  bestNextCount: queryInteger(z.number().int().min(0).max(QUALIFICATION_BEST_NEXT_MAX)).optional()
}).strict().refine(
  (value) => (value.topPerPool === undefined) === (value.bestNextCount === undefined),
  'topPerPool and bestNextCount go together'
)

export const createTiebreakSchema = z.object({
  participationIds: z.array(z.uuid()).min(2).max(TIEBREAK_PLAYERS_MAX),
  parameters: z.object({ topPerPool: topPerPoolSchema, bestNextCount: bestNextCountSchema }).strict().optional()
}).strict()

export const createRoundDrawSchema = z.object({
  roundKind: z.enum(ROUND_KIND).optional()
}).strict()

const roundAssignmentSchema = z.object({
  participationId: z.uuid(),
  pairingIndex: z.number().int().min(1).max(DRAW_ASSIGNMENTS_MAX),
  sidePosition: z.union([z.literal(1), z.literal(2)]),
  drawnOrder: z.number().int().min(1).max(DRAW_ASSIGNMENTS_MAX)
}).strict()

/** Remplace tout le contenu du brouillon d'un tirage de TOUR. La cohérence avec le vivier est vérifiée par le service. */
export const updateRoundDrawSchema = z.object({
  assignments: z.array(roundAssignmentSchema).max(DRAW_ASSIGNMENTS_MAX)
}).strict()
