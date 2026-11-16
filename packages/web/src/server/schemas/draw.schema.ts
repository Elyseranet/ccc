import { z } from 'zod'
import { DRAW_ASSIGNMENTS_MAX, DRAW_POOL_COUNT_MAX } from '../../consts/draw.const.js'

const poolCountSchema = z.number().int().min(1).max(DRAW_POOL_COUNT_MAX)

/** `?poules={n}` : une chaîne d'entiers, jamais un nombre à virgule ni un exposant. */
export const seedProposalQuerySchema = z.object({
  poules: z.string().regex(/^\d{1,3}$/, 'Expected a positive integer').transform(Number).pipe(poolCountSchema)
}).strict()

/** `.strict()` : un champ inconnu est refusé en 400, jamais ignoré. Les têtes de série sont des participationId (RG9). */
export const createPoolDrawSchema = z.object({
  poolCount: poolCountSchema,
  seedCount: poolCountSchema,
  seeds: z.array(z.uuid()).min(1).max(DRAW_POOL_COUNT_MAX)
}).strict()

export const drawParamsSchema = z.object({ id: z.uuid() })

const assignmentSchema = z.object({
  participationId: z.uuid(),
  poolNumber: z.number().int().min(1).max(DRAW_POOL_COUNT_MAX),
  drawnOrder: z.number().int().min(1).max(DRAW_ASSIGNMENTS_MAX)
}).strict()

/** Remplace tout le contenu du brouillon. La cohérence avec le tirage (poolCount, têtes de série, édition) est vérifiée par le service. */
export const updateDrawAssignmentsSchema = z.object({
  assignments: z.array(assignmentSchema).max(DRAW_ASSIGNMENTS_MAX)
}).strict()
