/** Partie de `useRuntimeConfig()` lue par le garde-fou de configuration de production (PROD-1, T-SEC-06). */
export interface IStrictRuntimeConfigInput {
  /** Booléen ou chaîne issue de `NUXT_STRICT_RUNTIME_CONFIG`. */
  strictRuntimeConfig?: unknown
  /** Vrai dans l'image de production (marqueur du Dockerfile) : le mode strict ne peut alors pas être éteint. */
  productionImage?: boolean
  public?: { siteUrl?: unknown }
  mail?: { transport?: unknown, host?: unknown, from?: unknown }
  auth?: { secureCookie?: unknown, deviceCookieSecret?: unknown }
}

/** Partie de `useRuntimeConfig()` lue pour savoir si le site est indexable (T-SEO-01), côté serveur comme côté client. */
export interface ISiteIndexableInput {
  /** Booléen ou chaîne issue de `NUXT_PUBLIC_SITE_INDEXABLE`. */
  public?: { siteIndexable?: unknown }
}
