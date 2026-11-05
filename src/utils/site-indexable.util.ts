import { SITE_INDEXABLE_ON_VALUES } from '../consts/runtime-config.const.js'
import type { ISiteIndexableInput } from '../interfaces/runtime-config.interface.js'

/**
 * Le site est-il indexable par les moteurs (T-SEO-01) ? Seule source de vérité, partagée par les routes Nitro
 * (`robots.txt`, `sitemap.xml`, `X-Robots-Tag`) et par le front (`useSeo`). Échec fermé : faux sauf `true` ou `'true'`.
 */
export const isSiteIndexable = (config: ISiteIndexableInput): boolean => {
  const value = config.public?.siteIndexable
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : value
  return (SITE_INDEXABLE_ON_VALUES as readonly unknown[]).includes(normalized)
}
