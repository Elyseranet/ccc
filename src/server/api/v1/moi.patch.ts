import { setResponseHeader } from 'h3'
import type { IMe } from '../../../interfaces/me.interface'
import { LOG_EVENT } from '../../../consts/log-event.const'
import { UserEntity } from '../../db/typeorm/entities/user.entity'
import { updateMeSchema } from '../../schemas/auth.schema'
import { enforcePasswordChangeRateLimit } from '../../../utils/login-rate-limit.util'
import { loadMe } from '../../../utils/me.util'
import { hashPassword, verifyPassword } from '../../../utils/password.util'
import { requireUser } from '../../../utils/require-role.util'
import { applyProfileChanges } from '../../../utils/profile-update.util'
import { invalidCurrentPassword, unprocessable } from '../../../utils/api-error.util'
import { readBodyWithSchema } from '../../../utils/validation.util'
import { logger } from '../../../utils/logger.util'
import { useDataSource } from '../../../utils/database.util'

/** A4 : le participant ne modifie que son avatar, son téléphone et son mot de passe. */
export default defineEventHandler(async (event): Promise<IMe> => {
  const user = requireUser(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const body = await readBodyWithSchema(event, updateMeSchema)
  const dataSource = await useDataSource()

  const wantsContactUpdate = body.avatarUrl !== undefined || body.phone !== undefined
  if (wantsContactUpdate && !user.competitorId) {
    throw unprocessable('This account has no competitor profile')
  }

  let newHash: string | undefined
  if (body.newPassword !== undefined && body.currentPassword !== undefined) {
    enforcePasswordChangeRateLimit(event, user.id)
    const account = await dataSource.getRepository(UserEntity).findOne({
      where: { id: user.id },
      select: { id: true, passwordHash: true }
    })
    if (!(await verifyPassword(body.currentPassword, account?.passwordHash))) {
      throw invalidCurrentPassword()
    }
    newHash = await hashPassword(body.newPassword)
  }

  await applyProfileChanges(dataSource, {
    userId: user.id,
    currentSessionId: user.sessionId,
    competitorId: user.competitorId,
    avatarUrl: body.avatarUrl,
    phone: body.phone,
    newPasswordHash: newHash
  })

  if (newHash) {
    logger.info(LOG_EVENT.AUTH_PASSWORD_CHANGED, { requestId: event.context.requestId, userId: user.id })
  }
  return loadMe(dataSource, user.id)
})
