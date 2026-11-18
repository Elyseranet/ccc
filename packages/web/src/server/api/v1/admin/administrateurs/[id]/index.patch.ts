import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../../enums/user.enum'
import type { IInvitationResent } from '../../../../../../interfaces/invitation.interface'
import { administratorIdParamsSchema } from '../../../../../schemas/administrator.schema'
import { setAccountEmailSchema } from '../../../../../schemas/competitor.schema'
import { sendAdministratorEmail, updateAdministratorEmail } from '../../../../../../services/administrator.service'
import { useDataSource } from '../../../../../../utils/database.util'
import { requireRole } from '../../../../../../utils/require-role.util'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../../../utils/validation.util'

/**
 * PATCH /api/v1/admin/administrateurs/{id} (administrateur, B-31) : corrige l'email d'un administrateur non activé ; l'ancien
 * lien répond 410 et le mail part à la nouvelle adresse. Compte actif : 409 `ACCOUNT_ACTIVE` ; email pris : 409 `EMAIL_ALREADY_USED`.
 */
export default defineEventHandler(async (event): Promise<IInvitationResent> => {
  const actor = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, administratorIdParamsSchema)
  const { email } = await readBodyWithSchema(event, setAccountEmailSchema)

  const updated = await updateAdministratorEmail(await useDataSource(), actor.id, id, email)
  const invitationSent = await sendAdministratorEmail(updated)
  return { invitationSent, invitationExpiresAt: updated.invitation!.expiresAt.toISOString() }
})
