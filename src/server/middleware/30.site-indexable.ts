import { SEO_ROBOTS_NOINDEX } from '../../consts/seo.const'
import { isSiteIndexable } from '../../utils/site-indexable.util'

/** Site non indexable (dev, recette) : `X-Robots-Tag: noindex, nofollow` sur toute réponse. Lu à chaque requête, pas au build (T-SEO-01). */
export default defineEventHandler((event) => {
  if (!isSiteIndexable(useRuntimeConfig(event))) {
    setResponseHeader(event, 'X-Robots-Tag', SEO_ROBOTS_NOINDEX)
  }
})
