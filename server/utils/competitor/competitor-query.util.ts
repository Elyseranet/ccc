import { z } from 'zod'
import {
  COMBINING_MARKS,
  COMPETITOR_DEFAULT_SORT,
  COMPETITOR_SEARCH_MAX_LENGTH,
  COMPETITOR_SEARCH_MIN_LENGTH,
  LIKE_SPECIAL_CHARACTERS
} from '../../consts/competitor.const'
import { COMPETITOR_SORT, SORT_ORDER } from '../../enums/competitor-sort.enum'

/** `?q=` : 2 à 50 caractères une fois les espaces de bord retirés. */
export const competitorListQuerySchema = z.object({
  q: z.string().trim().min(COMPETITOR_SEARCH_MIN_LENGTH).max(COMPETITOR_SEARCH_MAX_LENGTH).optional(),
  edition: z.uuid().optional(),
  sort: z.enum(COMPETITOR_SORT).default(COMPETITOR_DEFAULT_SORT),
  order: z.enum(SORT_ORDER).optional()
})

export const competitorIdParamsSchema = z.object({ id: z.uuid() })

export const headToHeadQuerySchema = z.object({ adversaire: z.uuid().optional() })

/** Minuscules sans accents : `Rémi` et `Remi` donnent la même chaîne. */
export const foldSearchText = (value: string): string =>
  value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()

/** `%`, `_` et `\` perdent leur sens de joker : `q=%` cherche un pourcent littéral. */
export const escapeLikePattern = (value: string): string => value.replace(LIKE_SPECIAL_CHARACTERS, '\\$&')

export const buildContainsPattern = (query: string): string => `%${escapeLikePattern(foldSearchText(query))}%`
