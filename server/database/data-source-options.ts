import type { DataSourceOptions } from 'typeorm'
import { ENTITIES } from './entities/index.js'
import type { IDatabaseConfig } from './interfaces/database-config.interface.js'
import { SnakeNamingStrategy } from './snake-case.naming-strategy.js'

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
  namingStrategy: new SnakeNamingStrategy()
})
