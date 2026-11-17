import { setResponseHeader, setResponseStatus } from 'h3'
import { LOG_EVENT } from '../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../enums/user.enum.js'
import { deleteEdition } from '../../../../../services/edition.service.js'
import { useDataSource } from '../../../../../utils/database.util.js'
import { logger } from '../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../utils/require-role.util.js'
import { getParamsWithSchema } from '../../../../../utils/validation.util.js'
import { editionParamsSchema } from '../../../../schemas/edition.schema.js'

/**
 * DELETE /api/v1/editions/{id} (administrateur, B-28) : supprime une édition créée dans l'appli, clôturée comprise, avec ses
 * participations, poules, tours, tirages et matchs. Les compétiteurs, comptes et invitations sont conservés. 204 ; 404 inconnue ;
 * 409 `EDITION_LEGACY_PROTECTED` pour une archive importée.
 */
export default defineEventHandler(async (event): Promise<void> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const { editionId, status } = await deleteEdition(await useDataSource(), id)
  logger.info(LOG_EVENT.EDITION_DELETED, { requestId: event.context.requestId, userId: user.id, editionId, status })
  setResponseStatus(event, 204)
})
