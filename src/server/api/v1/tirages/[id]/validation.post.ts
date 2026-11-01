import { setResponseHeader } from 'h3'
import { LOG_EVENT } from '../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../enums/user.enum.js'
import type { IAdminDraw } from '../../../../../interfaces/draw.interface.js'
import { validatePoolDraw } from '../../../../../services/draw.service.js'
import { useDataSource } from '../../../../../utils/database.util.js'
import { logger } from '../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../utils/require-role.util.js'
import { getParamsWithSchema } from '../../../../../utils/validation.util.js'
import { drawParamsSchema } from '../../../../schemas/draw.schema.js'

/**
 * POST /api/v1/tirages/{id}/validation (administrateur) : fige le tirage des poules et génère le round-robin (RG15).
 * Idempotent : rejouée sur un tirage déjà validé, elle renvoie 200 avec l'état courant sans regénérer de match.
 */
export default defineEventHandler(async (event): Promise<IAdminDraw> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, drawParamsSchema)
  const outcome = await validatePoolDraw(await useDataSource(), id, user.id)
  logger.info(LOG_EVENT.DRAW_VALIDATED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: outcome.editionId,
    drawId: id,
    matchCount: outcome.matchCount,
    replayed: outcome.replayed
  })
  return outcome.draw
})
