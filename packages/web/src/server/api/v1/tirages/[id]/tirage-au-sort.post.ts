import { setResponseHeader } from 'h3'
import { LOG_EVENT } from '../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../enums/user.enum.js'
import type { IAdminDraw } from '../../../../../interfaces/draw.interface.js'
import { randomDrawAssignments } from '../../../../../services/draw.service.js'
import { useDataSource } from '../../../../../utils/database.util.js'
import { logger } from '../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../utils/require-role.util.js'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../../utils/validation.util.js'
import { drawParamsSchema, randomDrawSchema } from '../../../../schemas/draw.schema.js'

/**
 * POST /api/v1/tirages/{id}/tirage-au-sort (administrateur) : le serveur tire les affectations du brouillon (poules : RG11 ; tour : RG13, RG14)
 * et les écrit au format de `PUT /tirages/{id}/affectations`, sans valider (B-26, A1 amendé). 409 DRAW_DRAFT_STARTED si le brouillon
 * contient déjà un tirage, sauf `{ "replace": true }`.
 */
export default defineEventHandler(async (event): Promise<IAdminDraw> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, drawParamsSchema)
  const body = await readBodyWithSchema(event, randomDrawSchema)
  const replace = body?.replace ?? false
  const outcome = await randomDrawAssignments(await useDataSource(), id, replace)
  logger.info(LOG_EVENT.DRAW_RANDOMIZED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: outcome.editionId,
    drawId: id,
    replace,
    assignmentCount: outcome.draw.assignments.length
  })
  return outcome.draw
})
