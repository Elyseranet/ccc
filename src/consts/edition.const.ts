/** Code lisible d'une édition (`2012a`, `2026`) accepté à la place de l'UUID dans l'URL. */
export const EDITION_CODE_PATTERN = /^[A-Za-z0-9-]{1,16}$/

/** Préfixe des ETag d'une réponse d'édition. */
export const EDITION_ETAG_PREFIX = 'ccc-ed'

export const CACHE_CONTROL_OPEN_EDITION = 'no-cache'

/** Garde-fou si `runtimeConfig.cache.closedEditionMaxAgeSeconds` n'est pas un entier valide. */
export const DEFAULT_CLOSED_EDITION_MAX_AGE_SECONDS = 3600

/** Relations nécessaires au DTO public d'un match (`toPublicMatch`). */
export const MATCH_PUBLIC_RELATIONS = { round: true, pool: true, sides: { participation: { competitor: true } } } as const
