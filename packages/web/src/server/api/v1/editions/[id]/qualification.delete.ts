import { setResponseHeader } from 'h3'
import { LOG_EVENT } from '../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../enums/user.enum.js'
import type { IQualificationStatus } from '../../../../../interfaces/qualification.interface.js'
import { loadQualificationStatus, reopenQualification } from '../../../../../services/qualification.service.js'
import { useDataSource } from '../../../../../utils/database.util.js'
import { logger } from '../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../utils/require-role.util.js'
import { getParamsWithSchema } from '../../../../../utils/validation.util.js'
import { editionParamsSchema } from '../../../../schemas/edition.schema.js'

/**
 * DELETE /api/v1/editions/{id}/qualification (administrateur) : rouvre la liste des qualifiés tant que le tirage du premier tour de
 * phase finale n'est pas validé (B-25). Rend l'état de la qualification, comme `GET /admin/editions/{id}/qualification`.
 * Idempotent : liste déjà rouverte, 200 sans effet. 409 `QUALIFICATION_LOCKED` une fois le tirage validé.
 */
export default defineEventHandler(async (event): Promise<IQualificationStatus> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const dataSource = await useDataSource()
  const { editionId, replayed, draftCleared } = await reopenQualification(dataSource, id)
  logger.info(LOG_EVENT.QUALIFICATION_REOPENED, { requestId: event.context.requestId, userId: user.id, editionId, draftCleared, replayed })
  return loadQualificationStatus(dataSource, editionId, null)
})
