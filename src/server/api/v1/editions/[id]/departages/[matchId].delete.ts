import { setResponseHeader, setResponseStatus } from 'h3'
import { LOG_EVENT } from '../../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../../enums/user.enum.js'
import { deleteTiebreak } from '../../../../../../services/qualification.service.js'
import { useDataSource } from '../../../../../../utils/database.util.js'
import { logger } from '../../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../../utils/require-role.util.js'
import { getParamsWithSchema } from '../../../../../../utils/validation.util.js'
import { tiebreakParamsSchema } from '../../../../../schemas/qualification.schema.js'

/**
 * DELETE /api/v1/editions/{id}/departages/{matchId} (administrateur) : supprime un départage non joué (204). 404 si le match
 * n'est pas un départage de l'édition, 409 TIEBREAK_PLAYED s'il est saisi ou validé, 409 EDITION_CLOSED si l'édition est close.
 */
export default defineEventHandler(async (event): Promise<void> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id, matchId } = await getParamsWithSchema(event, tiebreakParamsSchema)
  const outcome = await deleteTiebreak(await useDataSource(), id, matchId)
  logger.info(LOG_EVENT.TIEBREAK_DELETED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: outcome.editionId,
    matchId,
    poolId: outcome.poolId,
    sideCount: outcome.sideCount
  })
  setResponseStatus(event, 204)
})
