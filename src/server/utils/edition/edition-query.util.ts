import { z } from 'zod'
import { MATCH_STATUS } from '../../../enums/match.enum'
import { ROUND_KIND } from '../../../enums/round.enum'
import { EDITION_CODE_PATTERN } from '../../../consts/edition.const'
import { MATCH_SORT } from '../../../enums/match-sort.enum'
import type { IMatchListQuery } from '../../../interfaces/edition-query.interface'
import { parsePagination } from '../http/pagination.util'
import { parseWithSchema } from '../http/validation.util'

export const editionParamsSchema = z.object({
  id: z.string().refine(
    (value) => z.uuid().safeParse(value).success || EDITION_CODE_PATTERN.test(value),
    'Expected an edition UUID or code'
  )
})

export const isEditionUuid = (value: string): boolean => z.uuid().safeParse(value).success

/** `statut=A,B` ou `statut=A&statut=B`. RECORDED n'existe pas côté public (E-f) : il est refusé. */
const publicStatusSchema = z.enum(MATCH_STATUS).refine(
  (status) => status !== MATCH_STATUS.RECORDED,
  'RECORDED is not a public status'
)

const statusListSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : [value]).flatMap((item) => item.split(',')))
  .pipe(z.array(publicStatusSchema).min(1).max(Object.keys(MATCH_STATUS).length))

const matchListQuerySchema = z.object({
  tour: z.enum(ROUND_KIND).optional(),
  poule: z
    .string()
    .regex(/^[1-9]\d{0,3}$/, 'Expected a positive integer')
    .transform(Number)
    .optional(),
  statut: statusListSchema.optional(),
  tri: z.enum(MATCH_SORT).optional()
})

export const parseMatchListQuery = (query: Record<string, unknown>): IMatchListQuery => {
  const { tour, poule, statut, tri } = parseWithSchema(matchListQuerySchema, {
    tour: query.tour,
    poule: query.poule,
    statut: query.statut,
    tri: query.tri
  })
  return {
    pagination: parsePagination(query),
    roundKind: tour,
    poolRank: poule,
    statuses: statut ? [...new Set(statut)] : undefined,
    sort: tri
  }
}
