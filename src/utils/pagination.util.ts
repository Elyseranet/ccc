import type { IPaginationParams } from '../interfaces/pagination-params.interface.js'
import type { IPaginated } from '../interfaces/pagination.interface.js'
import { paginationQuerySchema } from '../server/schemas/pagination.schema.js'
import { parseWithSchema } from './validation.util.js'

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
