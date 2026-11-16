import { setResponseHeader, setResponseStatus } from 'h3'
import { LOG_EVENT } from '../../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../../enums/user.enum.js'
import type { IAdminDraw } from '../../../../../../interfaces/draw.interface.js'
import { createRoundDraw } from '../../../../../../services/draw.service.js'
import { useDataSource } from '../../../../../../utils/database.util.js'
import { logger } from '../../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../../utils/require-role.util.js'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../../../utils/validation.util.js'
import { editionParamsSchema } from '../../../../../schemas/edition.schema.js'
import { createRoundDrawSchema } from '../../../../../schemas/qualification.schema.js'

/**
 * POST /api/v1/editions/{id}/tirages/tour (administrateur) : ouvre le brouillon du tirage du tour suivant (RG13). Un nouveau POST
 * remplace le brouillon tant qu'il n'est pas validé ; 409 une fois le tour créé, ou si le tour précédent n'est pas entièrement validé.
 */
export default defineEventHandler(async (event): Promise<IAdminDraw> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const body = await readBodyWithSchema(event, createRoundDrawSchema)
  const outcome = await createRoundDraw(await useDataSource(), id, user.id, body)
  logger.info(LOG_EVENT.DRAW_CREATED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: outcome.editionId,
    drawId: outcome.draw.id,
    roundKind: outcome.draw.roundKind
  })
  setResponseStatus(event, 201)
  return outcome.draw
})
