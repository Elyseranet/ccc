import { describe, expect, it } from 'vitest'
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE
} from '../../src/consts/pagination.const'
import { toApiError } from '../../src/server/utils/http/api-error.util'
import { buildPaginated, parsePagination } from '../../src/server/utils/http/pagination.util'

const statusOf = (query: Record<string, unknown>): number => {
  try {
    parsePagination(query)
  } catch (error) {
    return toApiError(error).statusCode
  }
  return 200
}

describe('parsePagination', () => {
  it('applies defaults when the query is empty', () => {
    expect(parsePagination({})).toEqual({
      page: PAGINATION_DEFAULT_PAGE,
      pageSize: PAGINATION_DEFAULT_PAGE_SIZE,
      skip: 0,
      take: PAGINATION_DEFAULT_PAGE_SIZE
    })
  })

  it('computes skip and take from page and pageSize', () => {
    expect(parsePagination({ page: '3', pageSize: '10' })).toEqual({ page: 3, pageSize: 10, skip: 20, take: 10 })
  })

  it('accepts the upper bound of pageSize', () => {
    expect(parsePagination({ pageSize: String(PAGINATION_MAX_PAGE_SIZE) }).pageSize).toBe(PAGINATION_MAX_PAGE_SIZE)
  })

  it.each([
    ['pageSize above the maximum', { pageSize: String(PAGINATION_MAX_PAGE_SIZE + 1) }],
    ['pageSize of zero', { pageSize: '0' }],
    ['page of zero', { page: '0' }],
    ['negative page', { page: '-1' }],
    ['non-numeric page', { page: 'abc' }],
    ['non-numeric pageSize', { pageSize: 'ten' }],
    ['decimal page', { page: '1.5' }],
    ['empty page', { page: '' }],
    ['repeated page', { page: ['1', '2'] }]
  ])('rejects %s with a 400', (_label, query) => {
    expect(statusOf(query)).toBe(400)
  })
})

describe('buildPaginated', () => {
  it('builds the IPaginated envelope', () => {
    expect(buildPaginated(['a', 'b'], 42, { page: 2, pageSize: 2 })).toEqual({
      items: ['a', 'b'],
      total: 42,
      page: 2,
      pageSize: 2
    })
  })
})
