import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../enums/user.enum'
import type { IAdminEditionSummary } from '../../../../../interfaces/edition.interface'
import { loadAllAdminEditionSummaries } from '../../../../../services/edition.service'
import { useDataSource } from '../../../../../utils/database.util'
import { requireRole } from '../../../../../utils/require-role.util'

/**
 * GET /api/v1/admin/editions : toutes les éditions (de la plus récente à la plus ancienne, sans pagination) avec le nombre
 * d'inscrits en direct (`registeredCount`). Administrateur seulement, rôle vérifié avant toute lecture.
 */
export default defineEventHandler(async (event): Promise<IAdminEditionSummary[]> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return loadAllAdminEditionSummaries(await useDataSource())
})
