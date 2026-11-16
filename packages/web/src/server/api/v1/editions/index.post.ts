import { setResponseStatus } from 'h3'
import { USER_ROLE } from '../../../../enums/user.enum'
import type { IEditionSummary } from '../../../../interfaces/edition.interface'
import { LOG_EVENT } from '../../../../consts/log-event.const'
import { createEditionSchema } from '../../../schemas/edition.schema'
import { createEdition, loadEditionSummaries } from '../../../../services/edition.service'
import { useDataSource } from '../../../../utils/database.util'
import { logger } from '../../../../utils/logger.util'
import { requireRole } from '../../../../utils/require-role.util'
import { readBodyWithSchema } from '../../../../utils/validation.util'

/** POST /api/v1/editions : crée une édition (administrateur). `code` et `chronologicalRank` sont calculés. */
export default defineEventHandler(async (event): Promise<IEditionSummary> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  const input = await readBodyWithSchema(event, createEditionSchema)
  const dataSource = await useDataSource()
  const edition = await createEdition(dataSource, input)
  logger.info(LOG_EVENT.EDITION_CREATED, { requestId: event.context.requestId, userId: user.id, editionId: edition.id })
  setResponseStatus(event, 201)
  return (await loadEditionSummaries(dataSource, [edition]))[0]!
})
