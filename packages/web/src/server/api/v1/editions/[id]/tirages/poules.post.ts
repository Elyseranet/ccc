import { setResponseHeader, setResponseStatus } from 'h3'
import { LOG_EVENT } from '../../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../../enums/user.enum.js'
import type { IAdminDraw } from '../../../../../../interfaces/draw.interface.js'
import { createPoolDraw } from '../../../../../../services/draw.service.js'
import { useDataSource } from '../../../../../../utils/database.util.js'
import { logger } from '../../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../../utils/require-role.util.js'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../../../utils/validation.util.js'
import { createPoolDrawSchema } from '../../../../../schemas/draw.schema.js'
import { editionParamsSchema } from '../../../../../schemas/edition.schema.js'

/** POST /api/v1/editions/{id}/tirages/poules (administrateur) : ouvre le brouillon du tirage des poules (RG9, RG11, A1). */
export default defineEventHandler(async (event): Promise<IAdminDraw> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const body = await readBodyWithSchema(event, createPoolDrawSchema)
  const outcome = await createPoolDraw(await useDataSource(), id, user.id, body)
  logger.info(LOG_EVENT.DRAW_CREATED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: outcome.editionId,
    drawId: outcome.draw.id,
    poolCount: body.poolCount
  })
  setResponseStatus(event, 201)
  return outcome.draw
})
