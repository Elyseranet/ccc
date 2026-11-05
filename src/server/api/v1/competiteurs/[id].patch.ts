import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../enums/user.enum'
import type { ICompetitorIdentity } from '../../../../interfaces/competitor.interface'
import { LOG_EVENT } from '../../../../consts/log-event.const'
import { competitorIdParamsSchema, updateCompetitorSchema } from '../../../schemas/competitor.schema'
import { updateCompetitorIdentity } from '../../../../services/competitor.service'
import { useDataSource } from '../../../../utils/database.util'
import { logger } from '../../../../utils/logger.util'
import { readRequiredIfMatchVersion } from '../../../../utils/if-match.util'
import { requireRole } from '../../../../utils/require-role.util'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../utils/validation.util'

/**
 * PATCH /api/v1/competiteurs/{id} : corrige une identité (administrateur), `If-Match` obligatoire (428, 412 si périmé).
 * Pas d'avatar : B-16. La réponse porte la nouvelle version.
 */
export default defineEventHandler(async (event): Promise<ICompetitorIdentity> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  const patch = await readBodyWithSchema(event, updateCompetitorSchema)
  const expectedVersion = readRequiredIfMatchVersion(event)
  const competitor = await updateCompetitorIdentity(await useDataSource(), id, patch, expectedVersion)
  logger.info(LOG_EVENT.COMPETITOR_UPDATED, { requestId: event.context.requestId, userId: user.id, competitorId: competitor.id })
  return competitor
})
