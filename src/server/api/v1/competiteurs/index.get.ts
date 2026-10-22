import { COMPETITOR_DEFAULT_ORDER } from '../../../../consts/competitor.const'
import { LOG_EVENT } from '../../../../consts/log-event.const'
import { RATE_LIMIT_ROUTE_KEY } from '../../../../consts/rate-limit.const'
import { competitorListQuerySchema } from '../../../../schemas/competitor.schema'
import { listCompetitors } from '../../../../services/competitor.service'
import { parsePagination } from '../../../../utils/pagination.util'
import { enforceRateLimit } from '../../../../utils/rate-limit.util'
import { getQueryWithSchema } from '../../../../utils/validation.util'
import { logger } from '../../../../utils/logger.util'
import type { ICompetitorListItem } from '../../../../interfaces/competitor.interface'
import type { IPaginated } from '../../../../interfaces/pagination.interface'

/** GET /api/v1/competiteurs : liste publique, recherche `?q=` limitée en débit (décision E-e). */
export default defineEventHandler(async (event): Promise<IPaginated<ICompetitorListItem>> => {
  const rawQuery = getQuery(event)
  // Avant la validation : une rafale de `q` invalides consomme aussi le quota.
  // La recherche garde sa limite plus stricte ; la liste simple relève du budget public partagé.
  enforceRateLimit(event, rawQuery.q !== undefined ? RATE_LIMIT_ROUTE_KEY.COMPETITORS_SEARCH : RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)

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
