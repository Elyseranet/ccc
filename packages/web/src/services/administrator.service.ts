import { In, IsNull } from 'typeorm'
import type { DataSource, EntityManager } from 'typeorm'
import { LOG_EVENT } from '../consts/log-event.const.js'
import { INVITATION_EMAIL_KIND } from '../enums/invitation-email.enum.js'
import { USER_ROLE, USER_STATUS } from '../enums/user.enum.js'
import type { IAdminAccount, IAdminInviteResult, IAdminMailPayload } from '../interfaces/administrator.interface.js'
import { InvitationEntity } from '../server/db/typeorm/entities/invitation.entity.js'
import { UserEntity } from '../server/db/typeorm/entities/user.entity.js'
import { accountActive, alreadyAdmin, cannotRevokeSelf, emailAlreadyUsed, lastAdmin, notFound } from '../utils/api-error.util.js'
import { normalizeEmail } from '../utils/email.util.js'
import { isEmailCollision } from '../utils/email-collision.util.js'
import { issueInvitation } from '../utils/invitation-store.util.js'
import { logger } from '../utils/logger.util.js'
import { revokeAllSessions } from '../utils/session-store.util.js'
import { replaceInvitedAccountEmail } from './competitor.service.js'
import { sendInvitationEmail } from './invitation.service.js'

/*********************************************************
 * administrator.service
 *
 * @description
 * Côté serveur uniquement (B-31) : liste, invitation, correction d'email, renvoi et retrait des comptes administrateur.
 * Les écritures s'exécutent en une transaction ; le mail part ensuite, hors transaction (`sendInvitationEmail`).
 * Les logs ne portent que des identifiants : jamais d'email, de jeton ni de lien.
 ********************************************************/

/** Envoie le mail d'une écriture déjà validée ; `false` si l'envoi échoue (journalisé sans email par `sendInvitationEmail`). */
export const sendAdministratorEmail = ({ userId, email, firstName, kind, invitation }: IAdminMailPayload): Promise<boolean> =>
  sendInvitationEmail({ userId, email, firstName, kind, token: invitation?.invitationToken })

/** Compte `ADMIN` verrouillé (`FOR UPDATE`), avec sa fiche pour le prénom du mail. 404 s'il n'existe pas ou n'est pas administrateur. */
const lockAdministrator = async (manager: EntityManager, id: string): Promise<UserEntity> => {
  const user = await manager.getRepository(UserEntity).findOne({
    where: { id, role: USER_ROLE.ADMIN },
    relations: { competitor: true },
    // Requêtes séparées : PostgreSQL refuse FOR UPDATE sur le côté nullable d'une jointure externe.
    relationLoadStrategy: 'query',
    lock: { mode: 'pessimistic_write' }
  })
  if (!user) {
    throw notFound()
  }
  return user
}

/** Tous les comptes administrateur : actifs d'abord, puis par email. */
export const listAdministrators = async (dataSource: DataSource, currentUserId: string, now = new Date()): Promise<IAdminAccount[]> => {
  const users = await dataSource.getRepository(UserEntity).find({ where: { role: USER_ROLE.ADMIN }, relations: { competitor: true } })
  const invited = users.filter((user) => user.status === USER_STATUS.INVITED).map((user) => user.id)
  // Dernière invitation non consommée de chaque compte non activé : `issueInvitation` ramène les précédentes à l'instant.
  const invitations = invited.length === 0
    ? []
    : await dataSource.getRepository(InvitationEntity).find({
        where: { userId: In(invited), consumedAt: IsNull() },
        order: { expiresAt: 'DESC' },
        select: { userId: true, expiresAt: true }
      })
  const expiryByUser = new Map<string, Date>()
  for (const invitation of invitations) {
    if (!expiryByUser.has(invitation.userId)) {
      expiryByUser.set(invitation.userId, invitation.expiresAt)
    }
  }

  return users
    .map((user): IAdminAccount => {
      const expiresAt = user.status === USER_STATUS.INVITED ? expiryByUser.get(user.id) ?? null : null
      return {
        id: user.id,
        email: user.email,
        status: user.status,
        invitationExpiresAt: expiresAt?.toISOString() ?? null,
        invitationExpired: user.status === USER_STATUS.INVITED && (expiresAt === null || expiresAt.getTime() <= now.getTime()),
        competitor: user.competitor ? { id: user.competitor.id, displayName: user.competitor.displayName } : null,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        isSelf: user.id === currentUserId
      }
    })
    .sort((a, b) => Number(b.status === USER_STATUS.ACTIVE) - Number(a.status === USER_STATUS.ACTIVE) || a.email.localeCompare(b.email))
}

/**
 * `POST /admin/administrateurs` : crée un administrateur INVITED sans fiche, ou promeut le compte joueur de cet email (Q4) :
 * INVITED, même compte, nouvelle invitation (variante administrateur) ; ACTIVE, mot de passe, fiche et sessions conservés, mail
 * d'information sans lien (Q5). 409 `ALREADY_ADMIN` si le compte est déjà administrateur.
 */
export const inviteAdministrator = async (
  dataSource: DataSource,
  actorUserId: string,
  rawEmail: string,
  now = new Date()
): Promise<IAdminInviteResult> => {
  const email = normalizeEmail(rawEmail)
  let result: IAdminInviteResult
  try {
    result = await dataSource.transaction(async (manager): Promise<IAdminInviteResult> => {
      const users = manager.getRepository(UserEntity)
      const existing = await users.findOne({
        where: { email },
        relations: { competitor: true },
        relationLoadStrategy: 'query',
        lock: { mode: 'pessimistic_write' }
      })
      if (!existing) {
        const created = await users.save({ email, role: USER_ROLE.ADMIN, status: USER_STATUS.INVITED, passwordHash: null, competitorId: null })
        const invitation = await issueInvitation(manager, created.id, now)
        return { userId: created.id, email, firstName: '', kind: INVITATION_EMAIL_KIND.ADMIN, invitation, promoted: false, accountStatus: USER_STATUS.INVITED }
      }
      if (existing.role === USER_ROLE.ADMIN) {
        throw alreadyAdmin()
      }
      await users.update({ id: existing.id }, { role: USER_ROLE.ADMIN })
      const invited = existing.status === USER_STATUS.INVITED
      return {
        userId: existing.id,
        email,
        firstName: existing.competitor?.firstName ?? '',
        kind: invited ? INVITATION_EMAIL_KIND.ADMIN : INVITATION_EMAIL_KIND.ADMIN_PROMOTED,
        invitation: invited ? await issueInvitation(manager, existing.id, now) : null,
        promoted: true,
        accountStatus: existing.status
      }
    })
  } catch (error) {
    // Deux invitations concurrentes du même email inconnu : la seconde heurte `uq_users_email`.
    throw isEmailCollision(error) ? emailAlreadyUsed() : error
  }
  logger.info(result.promoted ? LOG_EVENT.ADMIN_PROMOTED : LOG_EVENT.ADMIN_INVITED, { actorUserId, targetUserId: result.userId })
  return result
}

/** `POST /admin/administrateurs/{id}/invitation` : nouvelle invitation, ancien lien 410. 409 `ACCOUNT_ACTIVE` si le compte est actif. */
export const resendAdministratorInvitation = (dataSource: DataSource, actorUserId: string, id: string, now = new Date()): Promise<IAdminMailPayload> =>
  dataSource.transaction(async (manager) => {
    const user = await lockAdministrator(manager, id)
    if (user.status === USER_STATUS.ACTIVE) {
      throw accountActive()
    }
    const invitation = await issueInvitation(manager, user.id, now)
    logger.info(LOG_EVENT.ADMIN_INVITATION_RESENT, { actorUserId, targetUserId: user.id })
    return { userId: user.id, email: user.email, firstName: user.competitor?.firstName ?? '', kind: INVITATION_EMAIL_KIND.ADMIN, invitation }
  })

/**
 * `PATCH /admin/administrateurs/{id}` : corrige l'email d'un administrateur non activé (nouvelle invitation, ancien lien 410).
 * 409 `ACCOUNT_ACTIVE` si le compte est actif ; 409 `EMAIL_ALREADY_USED` si l'email appartient à un autre compte.
 */
export const updateAdministratorEmail = (
  dataSource: DataSource,
  actorUserId: string,
  id: string,
  rawEmail: string,
  now = new Date()
): Promise<IAdminMailPayload> =>
  dataSource.transaction(async (manager) => {
    const email = normalizeEmail(rawEmail)
    const user = await lockAdministrator(manager, id)
    if (user.status === USER_STATUS.ACTIVE) {
      throw accountActive()
    }
    const owner = await manager.getRepository(UserEntity).findOne({ where: { email }, select: { id: true } })
    if (owner && owner.id !== user.id) {
      throw emailAlreadyUsed()
    }
    const invitation = await replaceInvitedAccountEmail(manager, user.id, email, now)
    logger.info(LOG_EVENT.ADMIN_EMAIL_UPDATED, { actorUserId, targetUserId: user.id })
    return { userId: user.id, email, firstName: user.competitor?.firstName ?? '', kind: INVITATION_EMAIL_KIND.ADMIN, invitation }
  })

/**
 * `DELETE /admin/administrateurs/{id}` : retire l'accès. Sous verrou `FOR UPDATE` de TOUS les comptes administrateur (pris dans
 * l'ordre des identifiants : deux retraits croisés s'attendent sans interblocage, et le second relit le rôle déjà changé) :
 * 409 `CANNOT_REVOKE_SELF` (Q3), 404 si le compte n'est pas administrateur, 409 `LAST_ADMIN` si plus aucun administrateur actif ne resterait.
 * ACTIVE : redevient PARTICIPANT et ses sessions sont révoquées (Q1). INVITED sans fiche : compte supprimé, invitations en cascade (Q2).
 * INVITED avec fiche (joueur promu) : redevient PARTICIPANT, invitations conservées.
 */
export const revokeAdministrator = async (dataSource: DataSource, actorUserId: string, id: string, now = new Date()): Promise<void> => {
  if (id === actorUserId) {
    throw cannotRevokeSelf()
  }
  await dataSource.transaction(async (manager) => {
    const users = manager.getRepository(UserEntity)
    const admins = await users.find({
      select: { id: true, status: true, competitorId: true },
      where: { role: USER_ROLE.ADMIN },
      order: { id: 'ASC' },
      lock: { mode: 'pessimistic_write' }
    })
    const target = admins.find((admin) => admin.id === id)
    if (!target) {
      throw notFound()
    }
    if (target.status === USER_STATUS.ACTIVE) {
      if (admins.filter((admin) => admin.status === USER_STATUS.ACTIVE).length <= 1) {
        throw lastAdmin()
      }
      await users.update({ id }, { role: USER_ROLE.PARTICIPANT })
      await revokeAllSessions(manager, id, now)
    } else if (target.competitorId === null) {
      await users.delete({ id })
    } else {
      await users.update({ id }, { role: USER_ROLE.PARTICIPANT })
    }
  })
  logger.info(LOG_EVENT.ADMIN_REVOKED, { actorUserId, targetUserId: id })
}
