import { z } from 'zod'
import {
  COMPETITOR_DEFAULT_SORT,
  COMPETITOR_SEARCH_MAX_LENGTH,
  COMPETITOR_SEARCH_MIN_LENGTH
} from '../../consts/competitor.const.js'
import { COMPETITOR_SORT, SORT_ORDER } from '../../enums/competitor-sort.enum.js'

/** `?q=` : 2 à 50 caractères une fois les espaces de bord retirés. */
export const competitorListQuerySchema = z.object({
  q: z.string().trim().min(COMPETITOR_SEARCH_MIN_LENGTH).max(COMPETITOR_SEARCH_MAX_LENGTH).optional(),
  edition: z.uuid().optional(),
  sort: z.enum(COMPETITOR_SORT).default(COMPETITOR_DEFAULT_SORT),
  order: z.enum(SORT_ORDER).optional()
})

export const competitorIdParamsSchema = z.object({ id: z.uuid() })

export const headToHeadQuerySchema = z.object({ adversaire: z.uuid().optional() })
