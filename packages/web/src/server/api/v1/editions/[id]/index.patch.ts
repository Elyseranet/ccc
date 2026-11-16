import { USER_ROLE } from '../../../../../enums/user.enum'
import type { IEditionSummary } from '../../../../../interfaces/edition.interface'
import { LOG_EVENT } from '../../../../../consts/log-event.const'
import { editionParamsSchema, updateEditionSchema } from '../../../../schemas/edition.schema'
import { loadEditionSummaries, updateEdition } from '../../../../../services/edition.service'
import { useDataSource } from '../../../../../utils/database.util'
import { logger } from '../../../../../utils/logger.util'
import { requireRole } from '../../../../../utils/require-role.util'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../../utils/validation.util'

/** PATCH /api/v1/editions/{id} : informations générales (R-9 : jamais le code, l'année, le rang ni le statut). */
export default defineEventHandler(async (event): Promise<IEditionSummary> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const patch = await readBodyWithSchema(event, updateEditionSchema)
  const dataSource = await useDataSource()
  const edition = await updateEdition(dataSource, id, patch)
  logger.info(LOG_EVENT.EDITION_UPDATED, { requestId: event.context.requestId, userId: user.id, editionId: edition.id })
  return (await loadEditionSummaries(dataSource, [edition]))[0]!
})
