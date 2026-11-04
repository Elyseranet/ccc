import { HEALTH_STATUS } from '../../../enums/health-status.enum'
import type { IHealth } from '../../../interfaces/health.interface'
import { LOG_EVENT } from '../../../consts/log-event.const'
import { MIGRATIONS_ASSET_STORAGE } from '../../../consts/health.const'
import { RATE_LIMIT_ROUTE_KEY } from '../../../consts/rate-limit.const'
import { loadMigrationsHealth, parseMigrationTimestamps, resolveAppVersion } from '../../../utils/health.util'
import { enforceRateLimit } from '../../../utils/rate-limit.util'
import { logger } from '../../../utils/logger.util'
import { HEALTH_DEADLINE_MS } from '../../../consts/database-config.const'
import { useDataSource } from '../../../utils/database.util'
import { withDeadline } from '../../../utils/deadline.util'

/**
 * Sonde de santé (publique, sous limiteur), appelée toutes les 30 s par le HEALTHCHECK de l'image. 200 si la base répond,
 * 503 sinon, avec le même format. Elle donne en plus la version déployée (injectée au build, `null` sinon) et l'état des
 * migrations (T-OPS-03), sans aucun détail sur l'infrastructure.
 */
export default defineEventHandler(async (event): Promise<IHealth> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.HEALTH)
  const version = resolveAppVersion(process.env.NUXT_APP_VERSION, useRuntimeConfig().appVersion)

  try {
    // T-SEC-17 : connexion et requête ont leurs délais (3 s), mais leur somme dépasserait le délai de 5 s du HEALTHCHECK :
    // le bloc entier est borné à 4 s, pour répondre 503 dans le délai même quand la base ne répond plus.
    const dataSource = await withDeadline((async () => {
      const connected = await useDataSource()
      await connected.query('SELECT 1')
      return connected
    })(), HEALTH_DEADLINE_MS)
    const shipped = parseMigrationTimestamps(await useStorage(MIGRATIONS_ASSET_STORAGE).getKeys())
    return { status: HEALTH_STATUS.OK, version, migrations: await loadMigrationsHealth(dataSource, shipped) }
  } catch (error) {
    const cause = ((error as { cause?: unknown }).cause ?? error) as { name?: string, code?: string }
    logger.error(LOG_EVENT.HEALTH_CHECK_FAILED, {
      requestId: event.context.requestId,
      errorName: cause.name,
      errorCode: cause.code
    })
    setResponseStatus(event, 503)
    return { status: HEALTH_STATUS.UNAVAILABLE, version, migrations: null }
  }
})
