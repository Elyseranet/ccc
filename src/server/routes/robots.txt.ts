import { SEO_ROBOTS_CONTENT_TYPE } from '../../consts/seo.const'
import { isSiteIndexable } from '../../utils/site-indexable.util'
import { buildRobotsTxt } from '../../utils/seo.util'

/** GET /robots.txt : lu à chaque requête, donc la variable d'indexation se change sans rebuild (T-SEO-01). */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  setResponseHeader(event, 'Content-Type', SEO_ROBOTS_CONTENT_TYPE)
  return buildRobotsTxt(String(config.public.siteUrl), isSiteIndexable(config))
})
