import { setResponseStatus } from 'h3'
import { USER_ROLE } from '../../../../../enums/user.enum'
import { LOG_EVENT } from '../../../../../consts/log-event.const'
import { removeAvatar } from '../../../../../services/avatar.service'
import { requireRole } from '../../../../../utils/require-role.util'
import { competitorIdParamsSchema } from '../../../../schemas/competitor.schema'
import { getParamsWithSchema } from '../../../../../utils/validation.util'
import { useDataSource } from '../../../../../utils/database.util'
import { logger } from '../../../../../utils/logger.util'

/** DELETE /api/v1/competiteurs/{id}/avatar : administrateur ; 204, ou 404 sans avatar. */
export default defineEventHandler(async (event): Promise<void> => {
  const admin = requireRole(event, USER_ROLE.ADMIN)
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  await removeAvatar(await useDataSource(), id)
  logger.info(LOG_EVENT.AVATAR_DELETED, { requestId: event.context.requestId, userId: admin.id, competitorId: id })
  setResponseStatus(event, 204)
})
