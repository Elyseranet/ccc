import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../../enums/user.enum.js'
import type { IAdminActivityItem } from '../../../../../../interfaces/admin-activity.interface.js'
import { loadAdminActivity } from '../../../../../../services/admin-activity.service.js'
import { useDataSource } from '../../../../../../utils/database.util.js'
import { requireRole } from '../../../../../../utils/require-role.util.js'
import { getParamsWithSchema, getQueryWithSchema } from '../../../../../../utils/validation.util.js'
import { adminActivityQuerySchema } from '../../../../../schemas/admin-activity.schema.js'
import { editionParamsSchema } from '../../../../../schemas/edition.schema.js'

/** A17, B-15 : activité récente de l'édition avec auteur, dérivée des validations de match et des tirages. Jamais mise en cache. */
export default defineEventHandler(async (event): Promise<IAdminActivityItem[]> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const { limit } = await getQueryWithSchema(event, adminActivityQuerySchema)
  return loadAdminActivity(await useDataSource(), id, limit)
})
