import type { DataSource } from 'typeorm'
import { USER_ROLE, USER_STATUS } from '../enums/user.enum.js'
import { LOG_EVENT } from '../consts/log-event.const.js'
import { UserEntity } from '../server/db/typeorm/entities/user.entity.js'
import { buildInvitationLink, resolveSiteOrigin } from './invitation-link.util.js'
import { issueInvitation } from './invitation-store.util.js'
import { logger } from './logger.util.js'

/**
 * Crée le premier administrateur (INVITED, sans mot de passe) et son invitation (7 jours, A14), dans une
 * transaction. Renvoie le lien, dont le jeton en clair n'existe qu'ici : l'appelant l'affiche une fois, sans le journaliser.
 */
export const createAdminWithInvitation = async (dataSource: DataSource, email: string, siteUrl: string, now = new Date()): Promise<string> => {
  // Contrôlé avant toute écriture : un siteUrl invalide ne laisse pas un compte sans lien.
  resolveSiteOrigin(siteUrl)
  const { userId, token } = await dataSource.transaction(async (manager) => {
    const admin = await manager.getRepository(UserEntity).save({
      email,
      role: USER_ROLE.ADMIN,
      status: USER_STATUS.INVITED,
      passwordHash: null,
      competitorId: null
    })
    const invitation = await issueInvitation(manager, admin.id, now)
    return { userId: admin.id, token: invitation.invitationToken }
  })
  logger.info(LOG_EVENT.ADMIN_CREATED, { userId })
  return buildInvitationLink(siteUrl, token)
}
