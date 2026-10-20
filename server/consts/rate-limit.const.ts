export const RATE_LIMIT_ROUTE_KEY = {
  HEALTH: 'health',
  COMPETITORS_SEARCH: 'competitors-search',
  RANKING_ACP: 'ranking-acp',
  RANKING_ALL_TIME: 'ranking-all-time',
  RANKING_EVOLUTION: 'ranking-evolution'
} as const

/** Clé de `runtimeConfig.rateLimit` portant les réglages propres à une route (surcharge des défauts). */
export const RATE_LIMIT_ROUTE_CONFIG_KEY = {
  [RATE_LIMIT_ROUTE_KEY.COMPETITORS_SEARCH]: 'competitorsSearch'
} as const

/** Nombre de groupes de 16 bits conservés pour agréger une IPv6 (4 groupes = préfixe /64). */
export const IPV6_PREFIX_GROUPS = 4
export const IPV6_TOTAL_GROUPS = 8

export const RATE_LIMIT_OPTION_NAMES = ['windowMs', 'maxRequests', 'maxKeys'] as const
