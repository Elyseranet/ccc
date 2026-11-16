import { setResponseHeader } from 'h3'
import { LOG_EVENT } from '../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../enums/user.enum.js'
import type { IRandomDrawResult } from '../../../../../interfaces/random-draw.interface.js'
import { randomDrawStep } from '../../../../../services/draw.service.js'
import { useDataSource } from '../../../../../utils/database.util.js'
import { logger } from '../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../utils/require-role.util.js'
import { getParamsWithSchema } from '../../../../../utils/validation.util.js'
import { drawParamsSchema } from '../../../../schemas/draw.schema.js'

/**
 * POST /api/v1/tirages/{id}/tirage-au-sort (administrateur, sans corps) : tire la PROCHAINE étape du brouillon, un clic = une étape
 * (poules : le prochain joueur et sa poule, RG11 ; tour : la prochaine affiche, RG13, RG14), la écrit au format de
 * `PUT /tirages/{id}/affectations` et ne valide rien (B-26, A1 amendé). 409 DRAW_DRAFT_COMPLETE quand tout est tiré.
 */
export default defineEventHandler(async (event): Promise<IRandomDrawResult> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, drawParamsSchema)
  const outcome = await randomDrawStep(await useDataSource(), id)
  logger.info(LOG_EVENT.DRAW_STEP_DRAWN, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: outcome.editionId,
    drawId: id,
    remaining: outcome.step.remaining
  })
  return { draw: outcome.draw, step: outcome.step }
})
