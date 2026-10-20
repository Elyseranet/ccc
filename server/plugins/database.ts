import { LOG_EVENT } from '../consts/log-event.const'
import { assertDatabaseConfig } from '../utils/database-config.util'
import { logger } from '../utils/logger.util'

/** Initialise la DataSource au démarrage ; l'échec est journalisé sans la chaîne de connexion. */
export default defineNitroPlugin(async () => {
  const { database } = useRuntimeConfig()
  // Hors try : en production, une configuration incomplète doit empêcher le démarrage.
  assertDatabaseConfig({
    host: database.host,
    port: Number(database.port),
    username: database.username,
    password: database.password,
    database: database.database
  })

  try {
    await useDataSource()
  } catch (error) {
    const cause = error as { name?: string, code?: string }
    logger.error(LOG_EVENT.DATABASE_INIT_FAILED, { errorName: cause.name, errorCode: cause.code })
  }
})
