import { SEO_ELLIPSIS } from '../consts/seo.const.js'

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
