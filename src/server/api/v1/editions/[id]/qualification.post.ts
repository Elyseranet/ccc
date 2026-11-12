import { setResponseHeader } from 'h3'
import { LOG_EVENT } from '../../../../../consts/log-event.const.js'
import { USER_ROLE } from '../../../../../enums/user.enum.js'
import type { IQualificationResult } from '../../../../../interfaces/qualification.interface.js'
import { finalizeQualification } from '../../../../../services/qualification.service.js'
import { useDataSource } from '../../../../../utils/database.util.js'
import { logger } from '../../../../../utils/logger.util.js'
import { requireRole } from '../../../../../utils/require-role.util.js'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../../utils/validation.util.js'
import { editionParamsSchema } from '../../../../schemas/edition.schema.js'
import { qualificationParametersSchema } from '../../../../schemas/qualification.schema.js'

/**
 * POST /api/v1/editions/{id}/qualification (administrateur) : fige la liste des qualifiés (RG18) et passe l'édition à
 * QUALIFIED. Idempotent : rejouée avec les mêmes paramètres, elle renvoie 200 sans effet.
 */
export default defineEventHandler(async (event): Promise<IQualificationResult> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const body = await readBodyWithSchema(event, qualificationParametersSchema)
  const { editionId, ...result } = await finalizeQualification(await useDataSource(), id, body)
  logger.info(LOG_EVENT.QUALIFICATION_FINALIZED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId,
    topPerPool: body.topPerPool,
    bestNextCount: body.bestNextCount,
    withPlayoff: body.withPlayoff,
    qualifiedCount: result.qualified.length,
    replayed: result.replayed
  })
  return result
})
