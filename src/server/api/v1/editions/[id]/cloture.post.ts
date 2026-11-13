import { setResponseHeader } from 'h3'
import { LOG_EVENT } from '../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../enums/user.enum.js'
import type { IEditionDetail } from '../../../../../interfaces/edition.interface.js'
import { closeEdition, findEditionOrThrow, loadEditionDetail } from '../../../../../services/edition.service.js'
import { useDataSource } from '../../../../../utils/database.util.js'
import { logger } from '../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../utils/require-role.util.js'
import { getParamsWithSchema } from '../../../../../utils/validation.util.js'
import { editionParamsSchema } from '../../../../schemas/edition.schema.js'

/**
 * POST /api/v1/editions/{id}/cloture (administrateur) : fige les points et clôt l'édition (P4.5). 409 FINAL_NOT_VALIDATED tant
 * que la finale n'est pas validée. Idempotent : une édition déjà CLOSED renvoie 200 avec son état, sans recalcul.
 */
export default defineEventHandler(async (event): Promise<IEditionDetail> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const dataSource = await useDataSource()
  const outcome = await closeEdition(dataSource, id)
  logger.info(LOG_EVENT.EDITION_CLOSED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: outcome.editionId,
    participantCount: outcome.participantCount,
    replayed: outcome.replayed
  })
  return loadEditionDetail(dataSource, await findEditionOrThrow(dataSource, outcome.editionId))
})
