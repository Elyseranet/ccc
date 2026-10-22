import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { buildDataSourceOptions } from '../server/db/typeorm/data-source-options.js'

let dataSourcePromise: Promise<DataSource> | undefined

/**
 * DataSource unique, initialisée paresseusement à partir de `runtimeConfig.database`.
 * En cas d'échec, la promesse est oubliée pour qu'un appel suivant puisse réessayer.
 */
export const useDataSource = (): Promise<DataSource> => {
  if (!dataSourcePromise) {
    const { database } = useRuntimeConfig()
    const dataSource = new DataSource(buildDataSourceOptions({
      host: database.host,
      port: Number(database.port),
      username: database.username,
      password: database.password,
      database: database.database
    }))
    dataSourcePromise = dataSource.initialize().catch((error: unknown) => {
      dataSourcePromise = undefined
      throw error
    })
  }
  return dataSourcePromise
}
