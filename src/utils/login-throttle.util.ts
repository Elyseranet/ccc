import type { DataSource, EntityTarget } from 'typeorm'
import { LOGIN_DELAY_BASE_SECONDS, LOGIN_DELAY_MAX_SECONDS, LOGIN_FREE_FAILURES, LOGIN_DELAY_MAX_EXPONENT } from '../consts/auth.const.js'
import { LoginDeviceEntity } from '../server/db/typeorm/entities/login-device.entity.js'
import { UserEntity } from '../server/db/typeorm/entities/user.entity.js'
import type { IThrottleCounters } from '../interfaces/auth.interface.js'
import type { TLoginAttemptReservation } from '../types/login-attempt-reservation.type.js'

/**
 * Délai imposé après `failedCount` tentatives non réussies (SEC-A2) : aucun jusqu'à 5, puis
 * 2^(échecs − 5) secondes, plafonné à 300 s. Pas de blocage dur.
 */
export const computeLoginDelaySeconds = (failedCount: number): number => {
  if (failedCount <= LOGIN_FREE_FAILURES) {
    return 0
  }
  return Math.min(LOGIN_DELAY_BASE_SECONDS ** Math.min(failedCount - LOGIN_FREE_FAILURES, LOGIN_DELAY_MAX_EXPONENT), LOGIN_DELAY_MAX_SECONDS)
}

/** Secondes restantes avant la fin du délai en cours, ou 0. */
export const remainingThrottleSeconds = (throttledUntil: Date | null, now: Date): number =>
  throttledUntil && throttledUntil.getTime() > now.getTime()
    ? Math.ceil((throttledUntil.getTime() - now.getTime()) / 1000)
    : 0

/**
 * Réserve une tentative de connexion AVANT de vérifier le mot de passe, en un seul UPDATE conditionnel :
 * il n'aboutit que si le compte n'est pas en délai, incrémente le compteur et pose le délai du nouveau
 * compte. Toute tentative compte donc comme un échec tant qu'elle n'a pas réussi (un succès remet tout
 * à zéro). Seule une requête passe la réservation à la fois ; N requêtes parallèles sur un compte en délai
 * n'obtiennent aucune tentative, et aucune n'atteint scrypt.
 *
 * Choix : un UPDATE conditionnel plutôt que `SELECT … FOR UPDATE` dans une transaction. Le prédicat, le
 * compteur et le délai sont évalués ensemble sous le verrou de ligne que PostgreSQL prend pour l'UPDATE
 * (les concurrents réévaluent le prédicat après l'attente), sans transaction ni aller-retour de plus.
 * Le délai est calculé en SQL à partir des constantes, passées en paramètres liés.
 */
const reserveAttempt = async (
  dataSource: DataSource,
  entity: EntityTarget<IThrottleCounters>,
  id: string,
  now: Date
): Promise<TLoginAttemptReservation> => {
  const repository = dataSource.getRepository(entity)
  const result = await dataSource
    .createQueryBuilder()
    .update(entity)
    .set({
      failedLoginCount: () => '"failed_login_count" + 1',
      throttledUntil: () => `CASE WHEN "failed_login_count" + 1 > :free
        THEN CAST(:now AS timestamptz) + make_interval(secs => LEAST(CAST(:max AS double precision),
          POWER(CAST(:base AS double precision), LEAST("failed_login_count" + 1 - :free, :maxExponent))))
        ELSE NULL END`
    })
    .where('id = :id AND ("throttled_until" IS NULL OR "throttled_until" <= CAST(:now AS timestamptz))', { id })
    .setParameters({
      now: now.toISOString(),
      free: LOGIN_FREE_FAILURES,
      base: LOGIN_DELAY_BASE_SECONDS,
      max: LOGIN_DELAY_MAX_SECONDS,
      maxExponent: LOGIN_DELAY_MAX_EXPONENT
    })
    .returning(['failedLoginCount'])
    .execute()

  const rows = result.raw as Array<{ failed_login_count: number }>
  if (rows.length > 0) {
    return { reserved: true, failedCount: Number(rows[0]!.failed_login_count) }
  }
  const current = await repository.createQueryBuilder('counter')
    .select('counter.throttledUntil', 'throttledUntil')
    .where('counter.id = :id', { id })
    .getRawOne<{ throttledUntil: Date | null }>()
  return { reserved: false, retryAfterSeconds: Math.max(1, remainingThrottleSeconds(current?.throttledUntil ?? null, now)) }
}

/** Réservation sur le compteur du COMPTE (client non reconnu). */
export const reserveLoginAttempt = (dataSource: DataSource, userId: string, now = new Date()): Promise<TLoginAttemptReservation> =>
  reserveAttempt(dataSource, UserEntity, userId, now)

/** Réservation sur le compteur propre à un APPAREIL de confiance (SEC-A4), indépendant de celui du compte. */
export const reserveDeviceLoginAttempt = (dataSource: DataSource, deviceId: string, now = new Date()): Promise<TLoginAttemptReservation> =>
  reserveAttempt(dataSource, LoginDeviceEntity, deviceId, now)
