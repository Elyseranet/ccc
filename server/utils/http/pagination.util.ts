import { z } from 'zod'
import type { IPaginationParams } from '../../interfaces/pagination-params.interface'
import type { IPaginated } from '../../../shared/interfaces/api/pagination.interface'
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE
} from '../../consts/pagination.const'
import { parseWithSchema } from './validation.util'

/** Entiers stricts : "abc", "1.5", "" et "-1" sont rejetés (400), pas silencieusement corrigés. */
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).max(PAGINATION_MAX_PAGE_SIZE).default(PAGINATION_DEFAULT_PAGE_SIZE)
})

export const parsePagination = (query: Record<string, unknown>): IPaginationParams => {
  const { page, pageSize } = parseWithSchema(paginationQuerySchema, { page: query.page, pageSize: query.pageSize })
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

export const buildPaginated = <T>(items: T[], total: number, params: Pick<IPaginationParams, 'page' | 'pageSize'>): IPaginated<T> => ({
  items,
  total,
  page: params.page,
  pageSize: params.pageSize
})
