import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../../enums/user.enum'
import type { IInvitationResent } from '../../../../../../interfaces/invitation.interface'
import { administratorIdParamsSchema } from '../../../../../schemas/administrator.schema'
import { resendAdministratorInvitation, sendAdministratorEmail } from '../../../../../../services/administrator.service'
import { useDataSource } from '../../../../../../utils/database.util'
import { requireRole } from '../../../../../../utils/require-role.util'
import { getParamsWithSchema } from '../../../../../../utils/validation.util'

/**
 * POST /api/v1/admin/administrateurs/{id}/invitation (administrateur, B-31) : renvoie l'invitation d'un administrateur non
 * activé ; l'ancien lien répond 410. Compte actif : 409 `ACCOUNT_ACTIVE`.
 */
export default defineEventHandler(async (event): Promise<IInvitationResent> => {
  const actor = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, administratorIdParamsSchema)

  const resent = await resendAdministratorInvitation(await useDataSource(), actor.id, id)
  const invitationSent = await sendAdministratorEmail(resent)
  return { invitationSent, invitationExpiresAt: resent.invitation!.expiresAt.toISOString() }
})
