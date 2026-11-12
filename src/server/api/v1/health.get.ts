import { HEALTH_STATUS } from '../../../enums/health-status.enum'
import type { IHealth } from '../../../interfaces/health.interface'
import { LOG_EVENT } from '../../../consts/log-event.const'
import { RATE_LIMIT_ROUTE_KEY } from '../../../consts/rate-limit.const'
import { enforceRateLimit } from '../../../utils/rate-limit.util'
import { logger } from '../../../utils/logger.util'
import { HEALTH_DEADLINE_MS } from '../../../consts/database-config.const'
import { useDataSource } from '../../../utils/database.util'
import { withDeadline } from '../../../utils/deadline.util'

export default defineEventHandler(async (event): Promise<IHealth> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.HEALTH)

  try {
    // T-SEC-17 : connexion et requête ont leurs délais (3 s), mais leur somme dépasserait le délai de 5 s du HEALTHCHECK :
    // le bloc entier est borné à 4 s, pour répondre 503 dans le délai même quand la base ne répond plus.
    await withDeadline((async () => {
      const dataSource = await useDataSource()
      await dataSource.query('SELECT 1')
    })(), HEALTH_DEADLINE_MS)
    return { status: HEALTH_STATUS.OK }
  } catch (error) {
    const cause = ((error as { cause?: unknown }).cause ?? error) as { name?: string, code?: string }
    logger.error(LOG_EVENT.HEALTH_CHECK_FAILED, {
      requestId: event.context.requestId,
      errorName: cause.name,
      errorCode: cause.code
    })
    setResponseStatus(event, 503)
    return { status: HEALTH_STATUS.UNAVAILABLE }
  }
})
