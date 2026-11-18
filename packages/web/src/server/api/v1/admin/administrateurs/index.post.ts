import { setResponseHeader, setResponseStatus } from 'h3'
import { USER_ROLE } from '../../../../../enums/user.enum'
import type { IAdminInvited } from '../../../../../interfaces/administrator.interface'
import { setAccountEmailSchema } from '../../../../schemas/competitor.schema'
import { inviteAdministrator, sendAdministratorEmail } from '../../../../../services/administrator.service'
import { useDataSource } from '../../../../../utils/database.util'
import { requireRole } from '../../../../../utils/require-role.util'
import { readBodyWithSchema } from '../../../../../utils/validation.util'

/**
 * POST /api/v1/admin/administrateurs (administrateur, B-31) : invite un administrateur (201) ou promeut le compte joueur de cet
 * email (200, Q4). Le mail part après le commit ; un échec d'envoi n'annule rien (`invitationSent: false`, renvoi possible).
 * Email déjà administrateur : 409 `ALREADY_ADMIN`.
 */
export default defineEventHandler(async (event): Promise<IAdminInvited> => {
  const actor = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { email } = await readBodyWithSchema(event, setAccountEmailSchema)

  const result = await inviteAdministrator(await useDataSource(), actor.id, email)
  const invitationSent = await sendAdministratorEmail(result)
  setResponseStatus(event, result.promoted ? 200 : 201)
  return {
    id: result.userId,
    accountStatus: result.accountStatus,
    promoted: result.promoted,
    invitationSent,
    invitationExpiresAt: result.invitation?.expiresAt.toISOString() ?? null
  }
})
