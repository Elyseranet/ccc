import { z } from 'zod'
import { MATCH_STATUS } from '../../enums/match.enum.js'
import { ROUND_KIND } from '../../enums/round.enum.js'
import { MATCH_SORT } from '../../enums/match-sort.enum.js'
import { EDITION_CODE_PATTERN } from '../../consts/edition.const.js'

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

export const matchStatusListSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : [value]).flatMap((item) => item.split(',')))
  .pipe(z.array(publicMatchStatusSchema).min(1).max(Object.keys(MATCH_STATUS).length))

export const matchListQuerySchema = z.object({
  tour: z.enum(ROUND_KIND).optional(),
  poule: z
    .string()
    .regex(/^[1-9]\d{0,3}$/, 'Expected a positive integer')
    .transform(Number)
    .optional(),
  statut: matchStatusListSchema.optional(),
  tri: z.enum(MATCH_SORT).optional()
})
