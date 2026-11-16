import { IsNull, MoreThan, Not } from 'typeorm'
import type { DataSource } from 'typeorm'
import { USER_STATUS } from '../enums/user.enum.js'
import type { IAcceptedInvitation, IAcceptInvitationRequest, IInvitationPreview, IResentInvitation } from '../interfaces/invitation.interface.js'
import type { ISendInvitationInput } from '../interfaces/mail.interface.js'
import { LOG_EVENT } from '../consts/log-event.const.js'
import { CompetitorEntity } from '../server/db/typeorm/entities/competitor.entity.js'
import { InvitationEntity } from '../server/db/typeorm/entities/invitation.entity.js'
import { UserEntity } from '../server/db/typeorm/entities/user.entity.js'
import { competitorNotFound, conflict, gone, notFound, unprocessable } from '../utils/api-error.util.js'
import { buildDisplayName } from '../utils/display-name.util.js'
import { buildInvitationEmail } from '../utils/invitation-email.util.js'
import { buildInvitationLink } from '../utils/invitation-link.util.js'
import { issueInvitation } from '../utils/invitation-store.util.js'
import { hashInvitationToken } from '../utils/invitation-token.util.js'
import { logger } from '../utils/logger.util.js'
import { hashPassword } from '../utils/password.util.js'
import { createSession } from '../utils/session-store.util.js'
import { useMailPort } from './mail.service.js'

/*********************************************************
 * invitation.service
 *
 * @description
 * Côté serveur uniquement (B-09) : aucun code navigateur ne l'importe. Vérification, consommation, renvoi et envoi par
 * email d'une invitation de première connexion. L'émission (`issueInvitation`) vit dans `invitation-store.util.ts`,
 * que `user:create-admin` partage hors de Nitro.
 ********************************************************/

/**
 * Invitation encore utilisable, avec son compte et son compétiteur. 404 si le jeton est inconnu ; 410 s'il est
 * consommé, expiré, invalidé par un renvoi, ou si le compte est déjà actif.
 */
const findUsableInvitation = async (dataSource: DataSource, token: string, now: Date): Promise<InvitationEntity> => {
  const invitation = await dataSource.getRepository(InvitationEntity).findOne({
    where: { tokenHash: hashInvitationToken(token) },
    relations: { user: { competitor: true } }
  })
  if (!invitation) {
    throw notFound()
  }
  if (invitation.consumedAt !== null || invitation.expiresAt.getTime() <= now.getTime() || invitation.user.status !== USER_STATUS.INVITED) {
    throw gone()
  }
  return invitation
}

/** `GET /auth/invitation/{jeton}` : de quoi pré-remplir le formulaire, rien d'autre (surface non authentifiée). */
export const previewInvitation = async (dataSource: DataSource, token: string, now = new Date()): Promise<IInvitationPreview> => {
  const { user } = await findUsableInvitation(dataSource, token, now)
  return { firstName: user.competitor?.firstName ?? null, nickname: user.competitor?.nickname ?? null }
}

const toNullable = (value: string | null): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * `POST /auth/invitation/{jeton}` : consomme le jeton (une seule fois, même sous deux requêtes concurrentes),
 * active le compte avec son mot de passe, complète le profil et ouvre une session, dans UNE transaction.
 * Renvoie le jeton de session en clair (à poser en cookie). Le hachage scrypt part après la vérification du
 * jeton : un jeton invalide ne coûte pas de calcul.
 */
export const acceptInvitation = async (
  dataSource: DataSource,
  token: string,
  input: IAcceptInvitationRequest,
  now = new Date()
): Promise<IAcceptedInvitation> => {
  const invitation = await findUsableInvitation(dataSource, token, now)
  const passwordHash = await hashPassword(input.password)

  return dataSource.transaction(async (manager) => {
    // Revendication atomique : la ligne verrouillée par le premier UPDATE fait attendre le second, qui ne trouve plus rien.
    const claimed = await manager.getRepository(InvitationEntity).update(
      { id: invitation.id, consumedAt: IsNull(), expiresAt: MoreThan(now) },
      { consumedAt: now }
    )
    if (claimed.affected !== 1) {
      throw gone()
    }
    // Les autres liens en attente de ce compte ne servent plus.
    await manager.getRepository(InvitationEntity).update(
      { userId: invitation.userId, id: Not(invitation.id), consumedAt: IsNull(), expiresAt: MoreThan(now) },
      { expiresAt: now }
    )
    await manager.getRepository(UserEntity).update(
      { id: invitation.userId },
      { passwordHash, status: USER_STATUS.ACTIVE, lastLoginAt: now, failedLoginCount: 0, throttledUntil: null }
    )

    const competitor = invitation.user.competitor
    if (competitor) {
      const firstName = input.firstName ?? competitor.firstName ?? ''
      const lastName = input.lastName ?? competitor.lastName ?? ''
      await manager.getRepository(CompetitorEntity).update({ id: competitor.id }, {
        firstName: firstName || null,
        lastName: lastName || null,
        displayName: buildDisplayName(firstName, lastName) || competitor.displayName,
        ...(input.nickname !== undefined ? { nickname: toNullable(input.nickname) } : {}),
        ...(input.phone !== undefined ? { phone: toNullable(input.phone) } : {})
      })
    }

    const sessionToken = await createSession(manager, invitation.userId, now)
    logger.info(LOG_EVENT.INVITATION_ACCEPTED, { userId: invitation.userId })
    return { userId: invitation.userId, sessionToken }
  })
}

/**
 * `POST /competiteurs/{id}/invitation` (A14) : nouvelle invitation, ancien lien invalidé, dans une transaction.
 * 404 si le compétiteur est inconnu ; 422 s'il n'a pas de compte (compétiteur historique : aucun email connu) ;
 * 409 si son compte est déjà actif. L'envoi de l'email part ensuite, hors de cette transaction.
 */
export const resendInvitation = async (dataSource: DataSource, competitorId: string, now = new Date()): Promise<IResentInvitation> =>
  dataSource.transaction(async (manager) => {
    const user = await manager.getRepository(UserEntity).findOne({ where: { competitorId }, relations: { competitor: true } })
    if (!user) {
      throw (await manager.getRepository(CompetitorEntity).exists({ where: { id: competitorId } }))
        ? unprocessable('This competitor has no account')
        : competitorNotFound()
    }
    if (user.status !== USER_STATUS.INVITED) {
      throw conflict('This account is already active')
    }
    const issued = await issueInvitation(manager, user.id, now)
    return { ...issued, userId: user.id, email: user.email, firstName: user.competitor?.firstName ?? '' }
  })

/**
 * Envoie l'email d'invitation. À appeler APRÈS le commit de la transaction qui a créé le compte : un échec d'envoi
 * ne défait jamais le compte. Renvoie `false` en cas d'échec (journalisé sans email, sans jeton, sans lien) ; le
 * renvoi d'invitation par l'administrateur reste possible.
 */
export const sendInvitationEmail = async (input: ISendInvitationInput): Promise<boolean> => {
  try {
    const link = buildInvitationLink(String(useRuntimeConfig().public.siteUrl), input.token)
    await useMailPort().send({ to: input.email, ...buildInvitationEmail({ firstName: input.firstName, link }) })
    logger.info(LOG_EVENT.INVITATION_SENT, { userId: input.userId })
    return true
  } catch (error) {
    // Le message d'erreur d'un transport SMTP peut citer l'adresse du destinataire : seul le type et le code sont journalisés.
    const code = (error as { code?: unknown } | null)?.code
    logger.error(LOG_EVENT.INVITATION_SEND_FAILED, {
      userId: input.userId,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorCode: typeof code === 'string' ? code : null
    })
    return false
  }
}
