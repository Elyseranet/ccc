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
