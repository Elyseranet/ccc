export const RATE_LIMIT_ROUTE_KEY = {
  HEALTH: 'health',
  COMPETITORS_SEARCH: 'competitors-search',
  PUBLIC_READ: 'public-read'
} as const

/** Clé de `runtimeConfig.rateLimit` portant les réglages propres à une route (surcharge des défauts). */
export const RATE_LIMIT_ROUTE_CONFIG_KEY = {
  [RATE_LIMIT_ROUTE_KEY.COMPETITORS_SEARCH]: 'competitorsSearch',
  [RATE_LIMIT_ROUTE_KEY.PUBLIC_READ]: 'publicRead'
} as const

/** Nombre de groupes de 16 bits conservés pour agréger une IPv6 (4 groupes = préfixe /64). */
export const IPV6_PREFIX_GROUPS = 4
export const IPV6_TOTAL_GROUPS = 8

export const RATE_LIMIT_OPTION_NAMES = ['windowMs', 'maxRequests', 'maxKeys'] as const

/** Adresse IPv4 encapsulée en IPv6 (`::ffff:a.b.c.d`). */
export const IPV4_MAPPED_PATTERN = /^::ffff:\d{1,3}(\.\d{1,3}){3}$/i
/** IPv4 : capture le préfixe /24. */
export const IPV4_PATTERN = /^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/
