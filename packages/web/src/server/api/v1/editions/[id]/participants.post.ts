import { setResponseStatus } from 'h3'
import { USER_ROLE } from '../../../../../enums/user.enum'
import type { IAddParticipantResult } from '../../../../../interfaces/edition.interface'
import type { ICompetitorWithAccount } from '../../../../../interfaces/invitation.interface'
import { LOG_EVENT } from '../../../../../consts/log-event.const'
import { CompetitorEntity } from '../../../../db/typeorm/entities/competitor.entity'
import { addParticipantSchema, editionParamsSchema } from '../../../../schemas/edition.schema'
import { createCompetitorWithAccount } from '../../../../../services/competitor.service'
import { addParticipant, findExistingCompetitor } from '../../../../../services/edition.service'
import { sendInvitationEmail } from '../../../../../services/invitation.service'
import { useDataSource } from '../../../../../utils/database.util'
import { normalizeEmail } from '../../../../../utils/email.util'
import { logger } from '../../../../../utils/logger.util'
import { requireRole } from '../../../../../utils/require-role.util'
import { getParamsWithSchema, readBodyWithSchema } from '../../../../../utils/validation.util'

/**
 * POST /api/v1/editions/{id}/participants (C8) : `{ competitorId }` rattache un compétiteur existant ;
 * `{ newCompetitor }` crée compétiteur, compte, invitation et participation dans une seule transaction.
 * 409 si déjà inscrit ou si le tirage des poules est validé. L'email d'invitation part APRÈS le commit.
 */
export default defineEventHandler(async (event): Promise<IAddParticipantResult> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const body = await readBodyWithSchema(event, addParticipantSchema)

  let account: ICompetitorWithAccount | undefined
  const resolveCompetitor = 'competitorId' in body
    ? findExistingCompetitor(body.competitorId)
    : async (manager: Parameters<ReturnType<typeof findExistingCompetitor>>[0]) => {
        account = await createCompetitorWithAccount(manager, body.newCompetitor)
        return manager.getRepository(CompetitorEntity).findOneByOrFail({ id: account.competitorId })
      }

  const { edition, participant } = await addParticipant(await useDataSource(), id, resolveCompetitor)
  logger.info(LOG_EVENT.PARTICIPANT_ADDED, {
    requestId: event.context.requestId,
    userId: user.id,
    editionId: edition.id,
    participationId: participant.participationId
  })

  // Après le commit de la transaction : un échec d'envoi ne défait ni le compte ni l'inscription,
  // et le renvoi reste possible (POST /competiteurs/{id}/invitation).
  let invitationSent: boolean | null = null
  if (account && 'newCompetitor' in body) {
    invitationSent = await sendInvitationEmail({
      userId: account.userId,
      email: normalizeEmail(body.newCompetitor.email),
      firstName: body.newCompetitor.firstName,
      token: account.invitationToken
    })
  }
  setResponseStatus(event, 201)
  return { ...participant, invitationSent }
})
