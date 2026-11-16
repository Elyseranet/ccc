import { QueryFailedError } from 'typeorm'
import { PG_UNIQUE_VIOLATION, USER_EMAIL_UNIQUE_CONSTRAINT } from '../consts/invitation.const.js'

/** Vrai pour la violation d'unicité (SQLSTATE 23505) de l'email d'un compte : course entre le contrôle et l'insertion. */
export const isEmailCollision = (error: unknown): boolean => {
  if (!(error instanceof QueryFailedError)) {
    return false
  }
  const driverError = error.driverError as { code?: string, constraint?: string } | undefined
  return driverError?.code === PG_UNIQUE_VIOLATION && driverError.constraint === USER_EMAIL_UNIQUE_CONSTRAINT
}
