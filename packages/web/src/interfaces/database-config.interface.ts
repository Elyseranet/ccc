export interface IDatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  timeouts?: IDatabaseTimeouts
}

/** Délais de la base en millisecondes ; 0 = pas de délai (T-SEC-17). */
export interface IDatabaseTimeouts {
  connectionTimeoutMs: number
  statementTimeoutMs: number
  queryTimeoutMs: number
}

/** Délais résolus, et les variables d'environnement dont la valeur était invalide (leurs noms seulement). */
export interface IResolvedDatabaseTimeouts {
  timeouts: IDatabaseTimeouts
  invalidVariables: string[]
}
