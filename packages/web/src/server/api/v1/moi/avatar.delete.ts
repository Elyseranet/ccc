import { setResponseStatus } from 'h3'
import { LOG_EVENT } from '../../../../consts/log-event.const'
import { removeAvatar } from '../../../../services/avatar.service'
import { requireUser } from '../../../../utils/require-role.util'
import { unprocessable } from '../../../../utils/api-error.util'
import { useDataSource } from '../../../../utils/database.util'
import { logger } from '../../../../utils/logger.util'

/** DELETE /api/v1/moi/avatar : 204 ; 404 si aucun avatar. */
export default defineEventHandler(async (event): Promise<void> => {
  const user = requireUser(event)
  if (!user.competitorId) {
    throw unprocessable('This account has no competitor profile')
  }
  await removeAvatar(await useDataSource(), user.competitorId)
  logger.info(LOG_EVENT.AVATAR_DELETED, { requestId: event.context.requestId, userId: user.id, competitorId: user.competitorId })
  setResponseStatus(event, 204)
})
