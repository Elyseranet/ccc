import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../../enums/user.enum.js'
import type { IAdminDraw } from '../../../../../../interfaces/draw.interface.js'
import { loadAdminDraws } from '../../../../../../services/draw.service.js'
import { useDataSource } from '../../../../../../utils/database.util.js'
import { requireRole } from '../../../../../../utils/require-role.util.js'
import { getParamsWithSchema } from '../../../../../../utils/validation.util.js'
import { editionParamsSchema } from '../../../../../schemas/edition.schema.js'

/** C7 : tous les tirages de l'édition, brouillons compris, avec auteur et horodatages. Jamais mis en cache. */
export default defineEventHandler(async (event): Promise<IAdminDraw[]> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  return loadAdminDraws(await useDataSource(), id)
})
