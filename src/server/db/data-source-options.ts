import type { DataSourceOptions } from 'typeorm'
import { ENTITIES } from './entities'
import type { IDatabaseConfig } from '../../interfaces/database-config.interface'
import { SnakeNamingStrategy } from './snake-case.naming-strategy'

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
  namingStrategy: new SnakeNamingStrategy()
})
