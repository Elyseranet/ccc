/** Partie de `useRuntimeConfig()` lue par le garde-fou de configuration de production (PROD-1). */
export interface IStrictRuntimeConfigInput {
  /** Booléen ou chaîne issue de `NUXT_STRICT_RUNTIME_CONFIG`. */
  strictRuntimeConfig?: unknown
  public?: { siteUrl?: unknown }
  mail?: { transport?: unknown, host?: unknown, from?: unknown }
}
