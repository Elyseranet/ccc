import { setResponseHeader, setResponseStatus } from 'h3'
import { LOG_EVENT } from '../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../enums/user.enum.js'
import type { IAdminMatch } from '../../../../../interfaces/admin-match.interface.js'
import { createTiebreak } from '../../../../../services/qualification.service.js'
import { useDataSource } from '../../../../../utils/database.util.js'
import { logger } from '../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../utils/require-role.util.js'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../../utils/validation.util.js'
import { editionParamsSchema } from '../../../../schemas/edition.schema.js'
import { createTiebreakSchema } from '../../../../schemas/qualification.schema.js'

/**
 * POST /api/v1/editions/{id}/departages (administrateur) : crée un match TIEBREAK pour exactement un groupe d'égalité courant
 * (201). Un départage non joué existant pour le groupe est renvoyé tel quel (200), sans en créer un second.
 */
export default defineEventHandler(async (event): Promise<IAdminMatch> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const body = await readBodyWithSchema(event, createTiebreakSchema)
  const outcome = await createTiebreak(await useDataSource(), id, body)
  logger.info(LOG_EVENT.TIEBREAK_CREATED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: outcome.editionId,
    matchId: outcome.match.id,
    sideCount: outcome.match.sides.length,
    replayed: outcome.replayed
  })
  setResponseStatus(event, outcome.replayed ? 200 : 201)
  return outcome.match
})
