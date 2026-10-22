import { IsNull, LessThan, Not } from 'typeorm'
import type { DataSource, EntityManager } from 'typeorm'
import { USER_STATUS } from '../../../enums/user.enum'
import { SessionEntity } from '../../database/entities/session.entity'
import { SESSION_ABSOLUTE_TIMEOUT_SECONDS, SESSION_IDLE_TIMEOUT_SECONDS, SESSION_PURGE_GRACE_MS, SESSION_TOUCH_INTERVAL_MS } from '../../../consts/auth.const'
import type { IAuthUser } from '../../interfaces/auth.interface'
import { generateSessionToken, hashSessionToken } from './session-token.util'

/** Crée une session et renvoie le jeton en clair : c'est la seule fois qu'il existe côté serveur. */
export const createSession = async (dataSource: DataSource, userId: string, now = new Date()): Promise<string> => {
  const { token, tokenHash } = generateSessionToken()
  await dataSource.getRepository(SessionEntity).insert({
    userId,
    tokenHash,
    expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_TIMEOUT_SECONDS * 1000),
    lastSeenAt: now
  })
  return token
}

/** Session valide (ni expirée ni révoquée) d'un compte actif, ou `null`. */
export const resolveSession = async (dataSource: DataSource, token: string, now = new Date()): Promise<IAuthUser | null> => {
  const session = await dataSource.getRepository(SessionEntity).findOne({
    where: { tokenHash: hashSessionToken(token), revokedAt: IsNull() },
    relations: { user: true }
  })
  if (!session) {
    return null
  }
  const idleForMs = now.getTime() - session.lastSeenAt.getTime()
  if (idleForMs > SESSION_IDLE_TIMEOUT_SECONDS * 1000) {
    // Inactive trop longtemps : la session est révoquée, pas seulement ignorée.
    await dataSource.getRepository(SessionEntity).update({ id: session.id, revokedAt: IsNull() }, { revokedAt: now })
    return null
  }
  if (session.expiresAt.getTime() <= now.getTime() || session.user.status !== USER_STATUS.ACTIVE) {
    return null
  }
  if (now.getTime() - session.lastSeenAt.getTime() >= SESSION_TOUCH_INTERVAL_MS) {
    await dataSource.getRepository(SessionEntity).update({ id: session.id }, { lastSeenAt: now })
  }
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    competitorId: session.user.competitorId,
    sessionId: session.id
  }
}

/** Idempotent : révoquer une session déjà révoquée ou inconnue ne change rien. */
export const revokeSessionByToken = async (dataSource: DataSource, token: string, now = new Date()): Promise<void> => {
  await dataSource.getRepository(SessionEntity).update(
    { tokenHash: hashSessionToken(token), revokedAt: IsNull() },
    { revokedAt: now }
  )
}

export const revokeOtherSessions = async (
  dataSource: DataSource | EntityManager,
  userId: string,
  keepSessionId: string,
  now = new Date()
): Promise<void> => {
  await dataSource.getRepository(SessionEntity).update(
    { userId, id: Not(keepSessionId), revokedAt: IsNull() },
    { revokedAt: now }
  )
}

/** Purge les sessions expirées depuis plus d'un jour ; appelée au login pour borner la table. */
export const purgeExpiredSessions = async (dataSource: DataSource, now = new Date()): Promise<void> => {
  await dataSource.getRepository(SessionEntity).delete({ expiresAt: LessThan(new Date(now.getTime() - SESSION_PURGE_GRACE_MS)) })
}
