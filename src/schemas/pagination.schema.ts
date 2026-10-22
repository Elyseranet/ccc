import { z } from 'zod'
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE
} from '../consts/pagination.const.js'

/** Entiers stricts : "abc", "1.5", "" et "-1" sont rejetés (400), pas silencieusement corrigés. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).max(PAGINATION_MAX_PAGE_SIZE).default(PAGINATION_DEFAULT_PAGE_SIZE)
})
