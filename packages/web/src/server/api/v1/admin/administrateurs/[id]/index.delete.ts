import { setResponseHeader, setResponseStatus } from 'h3'
import { USER_ROLE } from '../../../../../../enums/user.enum'
import { administratorIdParamsSchema } from '../../../../../schemas/administrator.schema'
import { revokeAdministrator } from '../../../../../../services/administrator.service'
import { useDataSource } from '../../../../../../utils/database.util'
import { requireRole } from '../../../../../../utils/require-role.util'
import { getParamsWithSchema } from '../../../../../../utils/validation.util'

/**
 * DELETE /api/v1/admin/administrateurs/{id} (administrateur, B-31) : retire l'accès administrateur (204). Actif : redevient
 * participant, sessions révoquées ; invité sans fiche : compte supprimé. 409 `CANNOT_REVOKE_SELF` / `LAST_ADMIN`.
 */
export default defineEventHandler(async (event): Promise<void> => {
  const actor = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, administratorIdParamsSchema)

  await revokeAdministrator(await useDataSource(), actor.id, id)
  setResponseStatus(event, 204)
})
