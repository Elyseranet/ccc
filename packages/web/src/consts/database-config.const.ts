/** Variable d'environnement attendue pour chaque champ de runtimeConfig.database. */
export const DATABASE_CONFIG_ENV_VARIABLES = {
  host: 'NUXT_DATABASE_HOST',
  username: 'NUXT_DATABASE_USERNAME',
  password: 'NUXT_DATABASE_PASSWORD',
  database: 'NUXT_DATABASE_DATABASE'
} as const

/**
 * T-SEC-17 : délais de la base, en millisecondes (0 = pas de délai).
 * - connexion (pg `connectionTimeoutMillis`) : ouverture d'une connexion ET attente d'un client libre dans le pool ;
 * - instruction (PostgreSQL `statement_timeout`) : la base annule la requête (SQLSTATE 57014). Il compte aussi l'attente
 *   d'un verrou (`SELECT … FOR UPDATE`) : une attente de verrou plus longue que ce délai devient une erreur ;
 * - requête (pg `query_timeout`) : filet côté client si le serveur ne répond plus, un peu au-dessus de l'instruction pour
 *   que la base annule d'abord.
 * Le serveur Nitro garde les trois ; la CLI (migrations, seed) ne borne que la connexion, pour qu'une migration longue
 * ne soit pas coupée.
 */
export const DATABASE_RUNTIME_CONNECTION_TIMEOUT_MS = 3000
export const DATABASE_RUNTIME_STATEMENT_TIMEOUT_MS = 3000
export const DATABASE_RUNTIME_QUERY_TIMEOUT_MS = 3500
export const DATABASE_CLI_CONNECTION_TIMEOUT_MS = 10000
export const DATABASE_CLI_STATEMENT_TIMEOUT_MS = 0
export const DATABASE_CLI_QUERY_TIMEOUT_MS = 0
export const DATABASE_TIMEOUT_MAX_MS = 600000

/** Défauts par portée : le serveur borne tout, la CLI ne borne que la connexion. */
export const DATABASE_TIMEOUT_DEFAULTS = {
  runtime: {
    connectionTimeoutMs: DATABASE_RUNTIME_CONNECTION_TIMEOUT_MS,
    statementTimeoutMs: DATABASE_RUNTIME_STATEMENT_TIMEOUT_MS,
    queryTimeoutMs: DATABASE_RUNTIME_QUERY_TIMEOUT_MS
  },
  cli: {
    connectionTimeoutMs: DATABASE_CLI_CONNECTION_TIMEOUT_MS,
    statementTimeoutMs: DATABASE_CLI_STATEMENT_TIMEOUT_MS,
    queryTimeoutMs: DATABASE_CLI_QUERY_TIMEOUT_MS
  }
} as const

/** Variables d'environnement des délais ; seuls ces NOMS apparaissent dans un log de valeur invalide, jamais la valeur. */
export const DATABASE_TIMEOUT_ENV_VARIABLES = {
  runtime: {
    connectionTimeoutMs: 'NUXT_DATABASE_CONNECTION_TIMEOUT_MS',
    statementTimeoutMs: 'NUXT_DATABASE_STATEMENT_TIMEOUT_MS',
    queryTimeoutMs: 'NUXT_DATABASE_QUERY_TIMEOUT_MS'
  },
  cli: {
    connectionTimeoutMs: 'NUXT_DATABASE_CLI_CONNECTION_TIMEOUT_MS',
    statementTimeoutMs: 'NUXT_DATABASE_CLI_STATEMENT_TIMEOUT_MS',
    queryTimeoutMs: 'NUXT_DATABASE_CLI_QUERY_TIMEOUT_MS'
  }
} as const

/** Messages d'erreur du pilote `pg` pour un délai de connexion ou de lecture (le pilote n'a pas de code pour eux). */
export const DATABASE_TIMEOUT_MESSAGES: readonly string[] = [
  'timeout exceeded when trying to connect',
  'Connection terminated due to connection timeout',
  'Query read timeout'
]

/** SQLSTATE 57014 `query_canceled` : posé par `statement_timeout` (et par une annulation explicite). */
export const PG_QUERY_CANCELED = '57014'

/** `Retry-After` (secondes) d'un 503 dû à un délai de la base. */
export const DATABASE_TIMEOUT_RETRY_AFTER_SECONDS = 5

/** Sonde de santé : délai global de son bloc base, sous le délai de 5 s du HEALTHCHECK de l'image. */
export const HEALTH_DEADLINE_MS = 4000
