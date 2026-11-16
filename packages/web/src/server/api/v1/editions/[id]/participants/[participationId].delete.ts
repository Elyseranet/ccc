import { setResponseStatus } from 'h3'
import { USER_ROLE } from '../../../../../../enums/user.enum'
import { LOG_EVENT } from '../../../../../../consts/log-event.const'
import { participationParamsSchema } from '../../../../../schemas/edition.schema'
import { removeParticipant } from '../../../../../../services/edition.service'
import { useDataSource } from '../../../../../../utils/database.util'
import { logger } from '../../../../../../utils/logger.util'
import { requireRole } from '../../../../../../utils/require-role.util'
import { getParamsWithSchema } from '../../../../../../utils/validation.util'

/**
 * DELETE /api/v1/editions/{id}/participants/{participationId} : retrait permis tant que le tirage des poules n'est
 * pas validé (Q1) ; son affectation dans un brouillon est supprimée. 409 une fois le tirage validé.
 */
export default defineEventHandler(async (event): Promise<void> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  const { id, participationId } = await getParamsWithSchema(event, participationParamsSchema)
  const edition = await removeParticipant(await useDataSource(), id, participationId)
  logger.info(LOG_EVENT.PARTICIPANT_REMOVED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: edition.id,
    participationId
  })
  setResponseStatus(event, 204)
})
