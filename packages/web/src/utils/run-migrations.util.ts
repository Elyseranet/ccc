import type { DataSource } from 'typeorm'
import { LOG_EVENT } from '../consts/log-event.const.js'
import { MIGRATION_COMMAND } from '../enums/migration-command.enum.js'
import { describeErrorForLog } from './log-sanitize.util.js'
import { logger } from './logger.util.js'

/**
 * Applique (`up`) ou annule la dernière (`revert`) migration et journalise le résultat en JSON, sans jamais
 * imprimer de requête SQL (la DataSource de l'appelant n'active pas `logging`). Renvoie le code de sortie du
 * processus : 0 si tout va bien, 1 sinon, ce dont l'entrypoint dépend. `dataSource` est initialisée par l'appelant.
 */
export async function runMigrationsCommand(dataSource: DataSource, command: string): Promise<number> {
  try {
    if (command === MIGRATION_COMMAND.UP) {
      const applied = await dataSource.runMigrations()
      if (applied.length === 0) {
        logger.info(LOG_EVENT.MIGRATIONS_UP_TO_DATE)
      } else {
        logger.info(LOG_EVENT.MIGRATIONS_APPLIED, { count: applied.length, migrations: applied.map((migration) => migration.name) })
      }
      return 0
    }
    if (command === MIGRATION_COMMAND.REVERT) {
      const executed: Array<{ name: string }> = await dataSource.query('SELECT name FROM migrations ORDER BY id DESC LIMIT 1')
      await dataSource.undoLastMigration()
      logger.info(LOG_EVENT.MIGRATIONS_REVERTED, { migrations: executed.map((migration) => migration.name) })
      return 0
    }
    logger.error(LOG_EVENT.MIGRATIONS_FAILED, { errorName: 'UsageError', usage: `run-migrations {${MIGRATION_COMMAND.UP}|${MIGRATION_COMMAND.REVERT}}` })
    return 1
  } catch (error) {
    // T-SEC-09 (L5) : type et code seulement, jamais le message (il peut citer utilisateur, base et hôte).
    logger.error(LOG_EVENT.MIGRATIONS_FAILED, describeErrorForLog(error))
    return 1
  }
}
