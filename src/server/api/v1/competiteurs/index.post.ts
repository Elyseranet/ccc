import { setResponseHeader, setResponseStatus } from 'h3'
import { USER_ROLE } from '../../../../enums/user.enum'
import type { ICompetitorCreated } from '../../../../interfaces/invitation.interface'
import { newCompetitorSchema } from '../../../schemas/competitor.schema'
import { createCompetitorWithAccount } from '../../../../services/competitor.service'
import { sendInvitationEmail } from '../../../../services/invitation.service'
import { useDataSource } from '../../../../utils/database.util'
import { normalizeEmail } from '../../../../utils/email.util'
import { requireRole } from '../../../../utils/require-role.util'
import { readBodyWithSchema } from '../../../../utils/validation.util'

/**
 * POST /api/v1/competiteurs (administrateur) : P1, cas 2. Crée le compétiteur, son compte INVITED et son
 * invitation en une transaction, puis envoie l'email APRÈS le commit. Si l'envoi échoue, le compte existe et la
 * réponse porte `invitationSent: false` ; le renvoi (POST /competiteurs/{id}/invitation) reste possible.
 */
export default defineEventHandler(async (event): Promise<ICompetitorCreated> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const body = await readBodyWithSchema(event, newCompetitorSchema)
  const dataSource = await useDataSource()

  const created = await dataSource.transaction((manager) => createCompetitorWithAccount(manager, body))
  const invitationSent = await sendInvitationEmail({
    userId: created.userId,
    email: normalizeEmail(body.email),
    firstName: body.firstName,
    token: created.invitationToken
  })

  setResponseStatus(event, 201)
  return { competitorId: created.competitorId, invitationSent, invitationExpiresAt: created.expiresAt.toISOString() }
})
