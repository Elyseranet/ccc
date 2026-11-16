import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { LOG_EVENT } from '../consts/log-event.const.js'
import { buildDataSourceOptions } from '../server/db/typeorm/data-source-options.js'
import { resolveDatabaseTimeouts } from './database-timeouts.util.js'
import { logger } from './logger.util.js'

let dataSourcePromise: Promise<DataSource> | undefined

/**
 * DataSource unique, initialisée paresseusement à partir de `runtimeConfig.database`.
 * En cas d'échec, la promesse est oubliée pour qu'un appel suivant puisse réessayer.
 */
export const useDataSource = (): Promise<DataSource> => {
  if (!dataSourcePromise) {
    const { database } = useRuntimeConfig()
    // T-SEC-17 : une valeur invalide garde le défaut ; le log nomme la variable, jamais sa valeur.
    const { timeouts, invalidVariables } = resolveDatabaseTimeouts({
      connectionTimeoutMs: database.connectionTimeoutMs,
      statementTimeoutMs: database.statementTimeoutMs,
      queryTimeoutMs: database.queryTimeoutMs
    }, 'runtime')
    if (invalidVariables.length > 0) {
      logger.warn(LOG_EVENT.DATABASE_TIMEOUT_CONFIG_INVALID, { variables: invalidVariables })
    }
    const dataSource = new DataSource(buildDataSourceOptions({
      host: database.host,
      port: Number(database.port),
      username: database.username,
      password: database.password,
      database: database.database,
      timeouts
    }))
    dataSourcePromise = dataSource.initialize().catch((error: unknown) => {
      dataSourcePromise = undefined
      throw error
    })
  }
  return dataSourcePromise
}
