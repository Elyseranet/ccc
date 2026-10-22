import { z } from 'zod'
import { EMAIL_MAX_LENGTH, PHONE_PATTERN } from '../../consts/auth.const.js'
import {
  COMPETITOR_DEFAULT_SORT,
  COMPETITOR_NAME_PART_MAX_LENGTH,
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

/** Création d'un compétiteur avec compte (INewCompetitor) : partagé par `POST /editions/{id}/participants` et `POST /competiteurs`. Pas d'avatar (AV-1). */
export const newCompetitorSchema = z.object({
  email: z.email().max(EMAIL_MAX_LENGTH),
  firstName: z.string().trim().min(1).max(COMPETITOR_NAME_PART_MAX_LENGTH),
  lastName: z.string().trim().min(1).max(COMPETITOR_NAME_PART_MAX_LENGTH),
  nickname: z.string().trim().min(1).max(COMPETITOR_NAME_PART_MAX_LENGTH).nullable().optional(),
  phone: z.string().trim().regex(PHONE_PATTERN, 'Invalid phone number').nullable().optional()
}).strict()
