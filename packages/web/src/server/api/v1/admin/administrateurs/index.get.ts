import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../enums/user.enum'
import type { IAdminAccount } from '../../../../../interfaces/administrator.interface'
import { listAdministrators } from '../../../../../services/administrator.service'
import { useDataSource } from '../../../../../utils/database.util'
import { requireRole } from '../../../../../utils/require-role.util'

/** GET /api/v1/admin/administrateurs (administrateur, B-31) : tous les comptes `ADMIN`, actifs d'abord. */
export default defineEventHandler(async (event): Promise<IAdminAccount[]> => {
  const actor = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return listAdministrators(await useDataSource(), actor.id)
})
