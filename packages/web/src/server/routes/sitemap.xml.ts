import { LOG_EVENT } from '../../consts/log-event.const'
import { RATE_LIMIT_ROUTE_KEY } from '../../consts/rate-limit.const'
import { SEO_SITEMAP_CONTENT_TYPE } from '../../consts/seo.const'
import { notFound } from '../../utils/api-error.util'
import { listCompetitorIds } from '../../services/competitor.service'
import { listEditionCodes } from '../../services/edition.service'
import { useDataSource } from '../../utils/database.util'
import { logger } from '../../utils/logger.util'
import { enforceRateLimit } from '../../utils/rate-limit.util'
import { buildSitemapPaths, buildSitemapXml } from '../../utils/seo.util'
import { isSiteIndexable } from '../../utils/site-indexable.util'

/** GET /sitemap.xml : pages publiques livrées, éditions et fiches joueurs. 404 quand le site n'est pas indexable (T-SEO-01). */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!isSiteIndexable(config)) {
    throw notFound()
  }
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  const db = await useDataSource()
  const [editionCodes, playerIds] = await Promise.all([listEditionCodes(db), listCompetitorIds(db)])
  const paths = buildSitemapPaths(editionCodes, playerIds)
  logger.info(LOG_EVENT.SITEMAP_SERVED, { requestId: event.context.requestId, urls: paths.length })
  setResponseHeader(event, 'Content-Type', SEO_SITEMAP_CONTENT_TYPE)
  return buildSitemapXml(String(config.public.siteUrl), paths)
})
