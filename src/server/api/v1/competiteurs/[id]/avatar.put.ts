import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../enums/user.enum'
import type { IAvatarUploadResponse } from '../../../../../interfaces/avatar.interface'
import { RATE_LIMIT_ROUTE_KEY } from '../../../../../consts/rate-limit.const'
import { LOG_EVENT } from '../../../../../consts/log-event.const'
import { replaceAvatar } from '../../../../../services/avatar.service'
import { requireRole } from '../../../../../utils/require-role.util'
import { readAvatarUpload } from '../../../../../utils/avatar-upload.util'
import { competitorIdParamsSchema } from '../../../../schemas/competitor.schema'
import { getParamsWithSchema } from '../../../../../utils/validation.util'
import { enforceRateLimit } from '../../../../../utils/rate-limit.util'
import { useDataSource } from '../../../../../utils/database.util'
import { logger } from '../../../../../utils/logger.util'

/** PUT /api/v1/competiteurs/{id}/avatar : administrateur, multipart à un seul champ `file`. */
export default defineEventHandler(async (event): Promise<IAvatarUploadResponse> => {
  // Avant toute lecture du corps et tout appel à sharp (CPU) : comme le login pour M2.
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.AVATAR_UPLOAD)
  const admin = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  const avatarUrl = await replaceAvatar(await useDataSource(), id, await readAvatarUpload(event))
  logger.info(LOG_EVENT.AVATAR_UPLOADED, { requestId: event.context.requestId, userId: admin.id, competitorId: id })
  return { avatarUrl }
})
