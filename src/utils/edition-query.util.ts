import { z } from 'zod'
import { MATCH_STATUS } from '../enums/match.enum.js'
import { matchListQuerySchema } from '../schemas/edition.schema.js'
import type { IMatchListQuery } from '../interfaces/edition-query.interface.js'
import { parsePagination } from './pagination.util.js'
import { parseWithSchema } from './validation.util.js'

export const isEditionUuid = (value: string): boolean => z.uuid().safeParse(value).success

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
