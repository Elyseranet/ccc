import { LOG_EVENT } from '../consts/log-event.const'
import { logger } from '../utils/logger.util'

/** Initialise la DataSource au démarrage ; l'échec est journalisé sans la chaîne de connexion. */
export default defineNitroPlugin(async () => {
  try {
    await useDataSource()
  } catch (error) {
    const cause = error as { name?: string, code?: string }
    logger.error(LOG_EVENT.DATABASE_INIT_FAILED, { errorName: cause.name, errorCode: cause.code })
  }
})
