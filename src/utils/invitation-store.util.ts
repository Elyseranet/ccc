import { IsNull, MoreThan } from 'typeorm'
import type { EntityManager } from 'typeorm'
import { INVITATION_TTL_MS } from '../consts/invitation.const.js'
import { LOG_EVENT } from '../consts/log-event.const.js'
import type { IIssuedInvitation } from '../interfaces/invitation.interface.js'
import { InvitationEntity } from '../server/db/typeorm/entities/invitation.entity.js'
import { generateInvitationToken } from './invitation-token.util.js'
import { logger } from './logger.util.js'

/**
 * Émet une invitation pour un compte et invalide les précédentes (A14) : leur `expires_at` est ramené à `now`,
 * elles répondent donc 410 comme un lien expiré. À appeler dans la transaction de l'appelant.
 * Le jeton en clair est renvoyé une seule fois ; seul son SHA-256 est stocké, et il n'est jamais journalisé.
 * Autonome (TypeORM seulement) : `user:create-admin` l'appelle hors de Nitro.
 */
export const issueInvitation = async (manager: EntityManager, userId: string, now = new Date()): Promise<IIssuedInvitation> => {
  await manager.getRepository(InvitationEntity).update(
    { userId, consumedAt: IsNull(), expiresAt: MoreThan(now) },
    { expiresAt: now }
  )
  const { token, tokenHash } = generateInvitationToken()
  const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS)
  await manager.getRepository(InvitationEntity).insert({ userId, tokenHash, expiresAt, consumedAt: null })
  logger.info(LOG_EVENT.INVITATION_ISSUED, { userId })
  return { invitationToken: token, expiresAt }
}
