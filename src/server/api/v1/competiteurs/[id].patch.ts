import { USER_ROLE } from '../../../../enums/user.enum'
import type { ICompetitorPublic } from '../../../../interfaces/competitor.interface'
import { LOG_EVENT } from '../../../../consts/log-event.const'
import { competitorIdParamsSchema, updateCompetitorSchema } from '../../../schemas/competitor.schema'
import { updateCompetitorIdentity } from '../../../../services/competitor.service'
import { useDataSource } from '../../../../utils/database.util'
import { logger } from '../../../../utils/logger.util'
import { requireRole } from '../../../../utils/require-role.util'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../utils/validation.util'

/** PATCH /api/v1/competiteurs/{id} : corrige une identité (administrateur). Pas d'avatar : B-16. */
export default defineEventHandler(async (event): Promise<ICompetitorPublic> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  const patch = await readBodyWithSchema(event, updateCompetitorSchema)
  const competitor = await updateCompetitorIdentity(await useDataSource(), id, patch)
  logger.info(LOG_EVENT.COMPETITOR_UPDATED, { requestId: event.context.requestId, userId: user.id, competitorId: competitor.id })
  return competitor
})
