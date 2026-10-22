import { setResponseHeader } from 'h3'
import type { IAvatarUploadResponse } from '../../../../interfaces/avatar.interface'
import { RATE_LIMIT_ROUTE_KEY } from '../../../../consts/rate-limit.const'
import { LOG_EVENT } from '../../../../consts/log-event.const'
import { replaceAvatar } from '../../../../services/avatar.service'
import { requireUser } from '../../../../utils/require-role.util'
import { readAvatarUpload } from '../../../../utils/avatar-upload.util'
import { unprocessable } from '../../../../utils/api-error.util'
import { enforceRateLimit } from '../../../../utils/rate-limit.util'
import { useDataSource } from '../../../../utils/database.util'
import { logger } from '../../../../utils/logger.util'

/** PUT /api/v1/moi/avatar : le participant pose l'avatar de SON compétiteur (multipart, champ `file`). */
export default defineEventHandler(async (event): Promise<IAvatarUploadResponse> => {
  // Avant toute lecture du corps et tout appel à sharp (CPU) : comme le login pour M2.
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.AVATAR_UPLOAD)
  const user = requireUser(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  if (!user.competitorId) {
    throw unprocessable('This account has no competitor profile')
  }
  const avatarUrl = await replaceAvatar(await useDataSource(), user.competitorId, await readAvatarUpload(event))
  logger.info(LOG_EVENT.AVATAR_UPLOADED, { requestId: event.context.requestId, userId: user.id, competitorId: user.competitorId })
  return { avatarUrl }
})
