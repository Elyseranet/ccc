import type { DataSource } from 'typeorm'
import { LOGIN_DELAY_BASE_SECONDS, LOGIN_DELAY_MAX_SECONDS, LOGIN_FREE_FAILURES } from '../../consts/auth.const'
import { UserEntity } from '../../database/entities/user.entity'

/**
 * Délai imposé après `failedCount` échecs consécutifs (SEC-A2) : aucun jusqu'à 5 échecs, puis
 * 2^(échecs − 5) secondes, plafonné à 300 s. Pas de blocage dur.
 */
export const computeLoginDelaySeconds = (failedCount: number): number => {
  if (failedCount <= LOGIN_FREE_FAILURES) {
    return 0
  }
  const exponent = failedCount - LOGIN_FREE_FAILURES
  // Au-delà de 30, la puissance dépasse largement le plafond : on évite un nombre démesuré.
  return Math.min(LOGIN_DELAY_BASE_SECONDS ** Math.min(exponent, 30), LOGIN_DELAY_MAX_SECONDS)
}

/** Secondes restantes avant la fin du délai en cours, ou 0. */
export const remainingThrottleSeconds = (throttledUntil: Date | null, now: Date): number =>
  throttledUntil && throttledUntil.getTime() > now.getTime()
    ? Math.ceil((throttledUntil.getTime() - now.getTime()) / 1000)
    : 0

/** Enregistre un échec de manière atomique et pose le délai correspondant. */
export const recordLoginFailure = async (dataSource: DataSource, userId: string, now = new Date()): Promise<number> => {
  // Incrément atomique côté base (pas de lecture puis écriture) : deux échecs simultanés comptent tous deux.
  const result = await dataSource
    .createQueryBuilder()
    .update(UserEntity)
    .set({ failedLoginCount: () => '"failed_login_count" + 1' })
    .where('id = :id', { id: userId })
    .returning(['failedLoginCount'])
    .execute()
  const failedCount = Number((result.raw as Array<{ failed_login_count: number }>)[0]?.failed_login_count ?? 0)
  const delaySeconds = computeLoginDelaySeconds(failedCount)
  if (delaySeconds > 0) {
    await dataSource.getRepository(UserEntity).update({ id: userId }, { throttledUntil: new Date(now.getTime() + delaySeconds * 1000) })
  }
  return failedCount
}
