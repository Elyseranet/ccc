import { COMPETITOR_DEFAULT_ORDER } from '../../../consts/competitor.const'
import { LOG_EVENT } from '../../../consts/log-event.const'
import { RATE_LIMIT_ROUTE_KEY } from '../../../consts/rate-limit.const'
import { competitorListQuerySchema } from '../../../utils/competitor/competitor-query.util'
import { listCompetitors } from '../../../utils/competitor/competitor.service.util'
import { parsePagination } from '../../../utils/http/pagination.util'
import { enforceRateLimit } from '../../../utils/http/rate-limit.util'
import { getQueryWithSchema } from '../../../utils/http/validation.util'
import { logger } from '../../../utils/logger.util'
import type { ICompetitorListItem } from '../../../../shared/interfaces/api/competitor.interface'
import type { IPaginated } from '../../../../shared/interfaces/api/pagination.interface'

/** GET /api/v1/competiteurs : liste publique, recherche `?q=` limitée en débit (décision E-e). */
export default defineEventHandler(async (event): Promise<IPaginated<ICompetitorListItem>> => {
  const rawQuery = getQuery(event)
  // Avant la validation : une rafale de `q` invalides consomme aussi le quota.
  if (rawQuery.q !== undefined) {
    enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.COMPETITORS_SEARCH)
  }

  const query = await getQueryWithSchema(event, competitorListQuerySchema)
  const pagination = parsePagination(rawQuery)
  const startedAt = Date.now()

  const result = await listCompetitors({
    ...query,
    order: query.order ?? COMPETITOR_DEFAULT_ORDER[query.sort],
    page: pagination.page,
    pageSize: pagination.pageSize
  })

  if (query.q !== undefined) {
    // Longueur seulement : le contenu de la recherche n'est jamais journalisé.
    logger.info(LOG_EVENT.COMPETITORS_SEARCH, {
      requestId: event.context.requestId,
      queryLength: query.q.length,
      resultCount: result.total,
      durationMs: Date.now() - startedAt
    })
  }
  return result
})
