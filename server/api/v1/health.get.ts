import { HEALTH_STATUS } from '../../../shared/enums/health-status.enum'
import type { IHealth } from '../../../shared/interfaces/api/health.interface'
import { LOG_EVENT } from '../../consts/log-event.const'
import { logger } from '../../utils/logger.util'

export default defineEventHandler(async (event): Promise<IHealth> => {
  try {
    const dataSource = await useDataSource()
    await dataSource.query('SELECT 1')
    return { status: HEALTH_STATUS.OK }
  } catch (error) {
    const cause = error as { name?: string, code?: string }
    logger.error(LOG_EVENT.HEALTH_CHECK_FAILED, {
      requestId: event.context.requestId,
      errorName: cause.name,
      errorCode: cause.code
    })
    setResponseStatus(event, 503)
    return { status: HEALTH_STATUS.UNAVAILABLE }
  }
})
