import { PAGE_DELIVERY } from '../consts/page-delivery.const.js'
import { ROUTES } from '../consts/routes.const.js'
import {
  SEO_ELLIPSIS,
  SEO_PRIVATE_ROUTE_PATTERNS,
  SEO_ROBOTS_DISALLOWED_PATHS,
  SEO_SITEMAP_NAMESPACE,
  SEO_SITEMAP_PATH,
  SEO_XML_DECLARATION,
  SEO_XML_ENTITIES
} from '../consts/seo.const.js'
import type { IPageDelivery } from '../interfaces/page-delivery.interface.js'

/**
 * URL canonique : l'origine du site (`runtimeConfig.public.siteUrl`, jamais déduite de l'en-tête Host) suivie du chemin, sans query ni
 * fragment ni slash final (sauf la racine). Le garde de production (PROD-1) impose une URL https réelle en production.
 */
export const buildCanonicalUrl = (siteUrl: string, path: string): string => {
  const origin = siteUrl.trim().replace(/\/+$/, '')
  const pathname = path.split(/[?#]/)[0] ?? ''
  const normalized = `/${pathname.replace(/^\/+/, '').replace(/\/+$/, '')}`
  return normalized === '/' ? origin : `${origin}${normalized}`
}

/** URL absolue d'une image de partage : chemin relatif rattaché au site, URL absolue gardée telle quelle, vide si rien n'est configuré. */
export const buildAbsoluteImageUrl = (siteUrl: string, image: string): string => {
  const value = image.trim()
  if (value === '') {
    return ''
  }
  return /^https?:\/\//i.test(value) ? value : buildCanonicalUrl(siteUrl, value)
}

/**
 * Rend un texte dont les paramètres peuvent être longs (le nom d'un joueur) en le bornant : tant que le rendu dépasse `max`, le paramètre
 * texte le plus long perd ses derniers caractères et reçoit une ellipse. Les autres paramètres et le texte fixe ne bougent pas ; l'appelant
 * retranche de `max` ce qu'il ajoute ensuite (le suffixe du site), si bien que le titre complet tient toujours dans le plafond.
 */
export const renderBounded = (render: (params: Record<string, string | number>) => string, params: Record<string, string | number>, max: number): string => {
  const current: Record<string, string | number> = { ...params }
  const stripEllipsis = (value: string): string => value.endsWith(SEO_ELLIPSIS) ? value.slice(0, -SEO_ELLIPSIS.length) : value
  let text = render(current)
  while (text.length > max) {
    const longest = Object.entries(current)
      .filter(([, value]) => typeof value === 'string' && stripEllipsis(value).length > 1)
      .sort(([, a], [, b]) => String(b).length - String(a).length)[0]
    if (!longest) {
      return `${text.slice(0, Math.max(0, max - 1))}${SEO_ELLIPSIS}`
    }
    const [name, value] = longest
    const bare = stripEllipsis(String(value))
    const kept = Math.max(1, bare.length - (text.length - max) - 1)
    current[name] = `${bare.slice(0, kept).trimEnd()}${SEO_ELLIPSIS}`
    text = render(current)
  }
  return text
}

/** Le chemin est-il privé ou légal (`SEO_PRIVATE_ROUTE_PATTERNS`) : jamais dans le sitemap. */
export const isSeoPrivateRoute = (path: string): boolean =>
  SEO_PRIVATE_ROUTE_PATTERNS.some((pattern) => {
    const base = pattern.endsWith('/**') ? pattern.slice(0, -3) : undefined
    return base === undefined ? path === pattern : path === base || path.startsWith(`${base}/`)
  })

/** Contenu de `robots.txt` : site non indexable, tout est interdit ; sinon pages privées et API interdites, sitemap annoncé. */
export const buildRobotsTxt = (siteUrl: string, indexable: boolean): string => {
  if (!indexable) {
    return 'User-agent: *\nDisallow: /\n'
  }
  const disallows = SEO_ROBOTS_DISALLOWED_PATHS.map(path => `Disallow: ${path}`)
  return ['User-agent: *', ...disallows, '', `Sitemap: ${buildCanonicalUrl(siteUrl, SEO_SITEMAP_PATH)}`, ''].join('\n')
}

export const escapeXml = (value: string): string => value.replace(/[&<>"']/g, char => SEO_XML_ENTITIES[char]!)

/** Pages statiques publiques livrées : ni privées, ni légales, ni dynamiques (`:param`, ajoutées une par entité). */
export const listSitemapStaticPaths = (table: Record<string, IPageDelivery> = PAGE_DELIVERY): string[] =>
  Object.entries(table)
    .filter(([path, page]) => page.delivered && !path.includes(':') && !isSeoPrivateRoute(path))
    .map(([path]) => path)

/** Chemins du sitemap : pages statiques, puis une URL par édition (si sa page est livrée) et par joueur (idem). */
export const buildSitemapPaths = (
  editionCodes: readonly string[],
  playerIds: readonly string[],
  table: Record<string, IPageDelivery> = PAGE_DELIVERY
): string[] => [
  ...listSitemapStaticPaths(table),
  ...(table[ROUTES.EDITION]?.delivered ? editionCodes.map(code => ROUTES.EDITION.replace(':id', encodeURIComponent(code))) : []),
  ...(table[ROUTES.PLAYER]?.delivered ? playerIds.map(id => ROUTES.PLAYER.replace(':id', encodeURIComponent(id))) : [])
]

export const buildSitemapXml = (siteUrl: string, paths: readonly string[]): string => {
  const urls = paths.map(path => `<url><loc>${escapeXml(buildCanonicalUrl(siteUrl, path))}</loc></url>`).join('')
  return `${SEO_XML_DECLARATION}<urlset xmlns="${SEO_SITEMAP_NAMESPACE}">${urls}</urlset>\n`
}
