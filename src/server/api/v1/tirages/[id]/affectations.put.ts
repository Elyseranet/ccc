import { setResponseHeader } from 'h3'
import { LOG_EVENT } from '../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../enums/user.enum.js'
import type { IAdminDraw } from '../../../../../interfaces/draw.interface.js'
import { saveDrawAssignments } from '../../../../../services/draw.service.js'
import { useDataSource } from '../../../../../utils/database.util.js'
import { logger } from '../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../utils/require-role.util.js'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../../utils/validation.util.js'
import { drawParamsSchema, updateDrawAssignmentsSchema } from '../../../../schemas/draw.schema.js'

/** PUT /api/v1/tirages/{id}/affectations (administrateur) : enregistre le brouillon du tirage physique (A1) ; le contenu est remplacé. */
export default defineEventHandler(async (event): Promise<IAdminDraw> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, drawParamsSchema)
  const body = await readBodyWithSchema(event, updateDrawAssignmentsSchema)
  const outcome = await saveDrawAssignments(await useDataSource(), id, body)
  logger.info(LOG_EVENT.DRAW_ASSIGNMENTS_SAVED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: outcome.editionId,
    drawId: id,
    assignmentCount: body.assignments.length
  })
  return outcome.draw
})
