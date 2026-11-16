import type { DataSourceOptions } from 'typeorm'
import { ENTITIES } from '../../../consts/entities.const.js'
import type { IDatabaseConfig, IDatabaseTimeouts } from '../../../interfaces/database-config.interface.js'
import { SnakeNamingStrategy } from './snake-case.naming-strategy.js'

/** Options `pg` : seuls les délais positifs sont posés. */
const buildPgTimeouts = (timeouts: IDatabaseTimeouts): Record<string, number> => ({
  ...(timeouts.connectionTimeoutMs > 0 ? { connectionTimeoutMillis: timeouts.connectionTimeoutMs } : {}),
  ...(timeouts.statementTimeoutMs > 0 ? { statement_timeout: timeouts.statementTimeoutMs } : {}),
  ...(timeouts.queryTimeoutMs > 0 ? { query_timeout: timeouts.queryTimeoutMs } : {})
})

/** Options communes à la CLI TypeORM et au runtime Nitro. */
export const buildDataSourceOptions = (
  config: IDatabaseConfig,
  migrations: string[] = []
): DataSourceOptions => ({
  type: 'postgres',
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.database,
  entities: ENTITIES,
  migrations,
  synchronize: false,
  // gen_random_uuid() est natif en PostgreSQL 13+ : aucune extension à installer (B-02).
  uuidExtension: 'pgcrypto',
  installExtensions: false,
  namingStrategy: new SnakeNamingStrategy(),
  // T-SEC-17 : délais transmis au pilote `pg` (0 ou absent = pas de délai). `statement_timeout` est posé à la connexion
  // et annule l'instruction côté PostgreSQL ; `query_timeout` est le filet côté client ; `connectionTimeoutMillis` borne
  // aussi l'attente d'un client libre dans le pool.
  extra: config.timeouts ? buildPgTimeouts(config.timeouts) : undefined
})
