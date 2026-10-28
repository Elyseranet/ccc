import { z } from 'zod'
import { MATCH_STATUS } from '../../enums/match.enum.js'
import { ROUND_KIND } from '../../enums/round.enum.js'
import { MATCH_SORT } from '../../enums/match-sort.enum.js'
import {
  EDITION_CODE_PATTERN,
  EDITION_DATE_PATTERN,
  EDITION_DESCRIPTION_MAX_LENGTH,
  EDITION_LOCATION_MAX_LENGTH,
  EDITION_NAME_MAX_LENGTH,
  EDITION_YEAR_MAX,
  EDITION_YEAR_MIN
} from '../../consts/edition.const.js'
import { newCompetitorSchema } from './competitor.schema.js'

export const editionParamsSchema = z.object({
  id: z.string().refine(
    (value) => z.uuid().safeParse(value).success || EDITION_CODE_PATTERN.test(value),
    'Expected an edition UUID or code'
  )
})

/** `statut=A,B` ou `statut=A&statut=B`. RECORDED n'existe pas côté public (E-f) : il est refusé. */
export const publicMatchStatusSchema = z.enum(MATCH_STATUS).refine(
  (status) => status !== MATCH_STATUS.RECORDED,
  'RECORDED is not a public status'
)

/** Liste de statuts de l'URL, chaque élément validé par `itemSchema` (côté public : sans RECORDED ; côté admin : tous). */
export const buildMatchStatusListSchema = (itemSchema: z.ZodType<MATCH_STATUS, string>) => z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : [value]).flatMap((item) => item.split(',')))
  .pipe(z.array(itemSchema).min(1).max(Object.keys(MATCH_STATUS).length))

export const matchStatusListSchema = buildMatchStatusListSchema(publicMatchStatusSchema)

export const matchTourSchema = z.enum(ROUND_KIND)

export const matchPouleSchema = z
  .string()
  .regex(/^[1-9]\d{0,3}$/, 'Expected a positive integer')
  .transform(Number)

export const matchListQuerySchema = z.object({
  tour: matchTourSchema.optional(),
  poule: matchPouleSchema.optional(),
  statut: matchStatusListSchema.optional(),
  tri: z.enum(MATCH_SORT).optional()
})

const requiredText = (max: number) => z.string().trim().min(1).max(max)
const optionalText = (max: number) => z.string().trim().min(1).max(max).nullable()

/**
 * Une date calendaire réelle : `2026-02-30` est refusée alors que le motif seul la laisserait passer. Son année reste
 * dans les bornes d'une édition (`EDITION_YEAR_MIN`..`EDITION_YEAR_MAX`) : `0000-01-01` passerait le motif mais ferait
 * échouer PostgreSQL (année 0 inexistante), soit une 500 au lieu d'une 400.
 */
const heldOnSchema = z.string().regex(EDITION_DATE_PATTERN, 'Expected YYYY-MM-DD').refine((value) => {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}, 'Not a valid calendar date').refine((value) => {
  const year = Number(value.slice(0, 4))
  return year >= EDITION_YEAR_MIN && year <= EDITION_YEAR_MAX
}, `Expected a year from ${EDITION_YEAR_MIN} to ${EDITION_YEAR_MAX}`)

/** `.strict()` : un champ inconnu (`code`, `status`…) est refusé en 400, jamais ignoré. */
export const createEditionSchema = z.object({
  year: z.number().int().min(EDITION_YEAR_MIN).max(EDITION_YEAR_MAX),
  name: requiredText(EDITION_NAME_MAX_LENGTH),
  heldOn: heldOnSchema.nullable().optional(),
  description: optionalText(EDITION_DESCRIPTION_MAX_LENGTH).optional(),
  location: optionalText(EDITION_LOCATION_MAX_LENGTH).optional()
}).strict()

/** R-9 : ni `code`, ni `year`, ni `chronologicalRank`, ni `status` ne figurent dans la liste blanche. */
export const updateEditionSchema = z.object({
  name: requiredText(EDITION_NAME_MAX_LENGTH).optional(),
  heldOn: heldOnSchema.nullable().optional(),
  description: optionalText(EDITION_DESCRIPTION_MAX_LENGTH).optional(),
  location: optionalText(EDITION_LOCATION_MAX_LENGTH).optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required')

/** Exactement l'une des deux formes ; tout autre champ (avatar compris, AV-1) est refusé en 400. */
export const addParticipantSchema = z.union([
  z.object({ competitorId: z.uuid() }).strict(),
  z.object({ newCompetitor: newCompetitorSchema }).strict()
])

export const participationParamsSchema = editionParamsSchema.extend({ participationId: z.uuid() })
