import 'reflect-metadata'
import { LOG_EVENT } from '../consts/log-event.const.js'
import { MIGRATION_COMMAND } from '../enums/migration-command.enum.js'
import dataSource from '../server/db/typeorm/data-source.js'
import { logger } from './logger.util.js'
import { runMigrationsCommand } from './run-migrations.util.js'

/**
 * Point d'entrée de `ccc-ops migrate` / `migrate:revert`. Contrairement à la CLI TypeORM, qui force
 * `logging: ['query', ...]` et imprime chaque requête SQL dans `docker logs`, la DataSource reste sans journal de
 * requêtes. `db:migration:*` garde la CLI pour le développement.
 */
const main = async (): Promise<void> => {
  try {
    await dataSource.initialize()
  } catch (error) {
    logger.error(LOG_EVENT.MIGRATIONS_FAILED, { message: error instanceof Error ? error.message : 'Unknown error' })
    process.exitCode = 1
    return
  }
  try {
    process.exitCode = await runMigrationsCommand(dataSource, process.argv[2] ?? MIGRATION_COMMAND.UP)
  } finally {
    await dataSource.destroy()
  }
}

void main()
