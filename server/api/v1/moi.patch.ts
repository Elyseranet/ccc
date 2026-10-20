import { setResponseHeader } from 'h3'
import type { IMe } from '../../../shared/interfaces/api/me.interface'
import { LOG_EVENT } from '../../consts/log-event.const'
import { CompetitorEntity } from '../../database/entities/competitor.entity'
import { UserEntity } from '../../database/entities/user.entity'
import { updateMeSchema } from '../../schemas/auth.schema'
import { enforcePasswordChangeRateLimit } from '../../utils/auth/login-rate-limit.util'
import { loadMe } from '../../utils/auth/me.util'
import { hashPassword, verifyPassword } from '../../utils/auth/password.util'
import { requireUser } from '../../utils/auth/require-role.util'
import { revokeOtherSessions } from '../../utils/auth/session-store.util'
import { invalidCurrentPassword, unprocessable } from '../../utils/http/api-error.util'
import { readBodyWithSchema } from '../../utils/http/validation.util'
import { logger } from '../../utils/logger.util'

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

  await dataSource.transaction(async (manager) => {
    if (wantsContactUpdate && user.competitorId) {
      await manager.getRepository(CompetitorEntity).update({ id: user.competitorId }, {
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {})
      })
    }
    if (newHash) {
      await manager.getRepository(UserEntity).update({ id: user.id }, { passwordHash: newHash })
    }
  })

  if (newHash) {
    await revokeOtherSessions(dataSource, user.id, user.sessionId)
    logger.info(LOG_EVENT.AUTH_PASSWORD_CHANGED, { requestId: event.context.requestId, userId: user.id })
  }
  return loadMe(dataSource, user.id)
})
