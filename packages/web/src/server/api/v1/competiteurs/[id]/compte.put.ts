import { setResponseHeader } from 'h3'
import { USER_ROLE, USER_STATUS } from '../../../../../enums/user.enum'
import type { IAccountEmailSet } from '../../../../../interfaces/invitation.interface'
import { competitorIdParamsSchema, setAccountEmailSchema } from '../../../../schemas/competitor.schema'
import { setCompetitorAccountEmail } from '../../../../../services/competitor.service'
import { sendInvitationEmail } from '../../../../../services/invitation.service'
import { useDataSource } from '../../../../../utils/database.util'
import { requireRole } from '../../../../../utils/require-role.util'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../../utils/validation.util'

/**
 * PUT /api/v1/competiteurs/{id}/compte (administrateur, B-29) : pose l'email d'un compétiteur sans compte (crée le compte
 * INVITED) ou corrige celui d'un compte INVITED (nouveau jeton, ancien lien 410). L'email part après le commit ; un échec
 * d'envoi n'annule rien (`invitationSent: false`, le renvoi A14 reste possible). Compte actif : 409 `ACCOUNT_ACTIVE`.
 */
export default defineEventHandler(async (event): Promise<IAccountEmailSet> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  const { email } = await readBodyWithSchema(event, setAccountEmailSchema)

  const dataSource = await useDataSource()
  const issued = await dataSource.transaction((manager) => setCompetitorAccountEmail(manager, id, email))
  const invitationSent = await sendInvitationEmail({
    userId: issued.userId,
    email: issued.email,
    firstName: issued.firstName,
    token: issued.invitationToken
  })
  return { accountStatus: USER_STATUS.INVITED, invitationSent, invitationExpiresAt: issued.expiresAt.toISOString() }
})
