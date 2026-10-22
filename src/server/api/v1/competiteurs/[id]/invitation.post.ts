import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../enums/user.enum'
import type { IInvitationResent } from '../../../../../interfaces/invitation.interface'
import { competitorIdParamsSchema } from '../../../../schemas/competitor.schema'
import { resendInvitation, sendInvitationEmail } from '../../../../../services/invitation.service'
import { useDataSource } from '../../../../../utils/database.util'
import { requireRole } from '../../../../../utils/require-role.util'
import { getParamsWithSchema } from '../../../../../utils/validation.util'

/**
 * POST /api/v1/competiteurs/{id}/invitation (administrateur, A14) : renvoie l'invitation. L'ancien lien est
 * invalidé (410) dès le commit ; l'email part ensuite, et un échec d'envoi n'annule rien (`invitationSent: false`).
 */
export default defineEventHandler(async (event): Promise<IInvitationResent> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)

  const resent = await resendInvitation(await useDataSource(), id)
  const invitationSent = await sendInvitationEmail({
    userId: resent.userId,
    email: resent.email,
    firstName: resent.firstName,
    token: resent.invitationToken
  })
  return { invitationSent, invitationExpiresAt: resent.expiresAt.toISOString() }
})
