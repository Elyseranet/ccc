import { QueryFailedError } from 'typeorm'
import { PG_UNIQUE_VIOLATION, USER_COMPETITOR_UNIQUE_CONSTRAINT, USER_EMAIL_UNIQUE_CONSTRAINT } from '../consts/invitation.const.js'

const isUniqueViolationOf = (error: unknown, constraint: string): boolean => {
  if (!(error instanceof QueryFailedError)) {
    return false
  }
  const driverError = error.driverError as { code?: string, constraint?: string } | undefined
  return driverError?.code === PG_UNIQUE_VIOLATION && driverError.constraint === constraint
}

/** Vrai pour la violation d'unicité (SQLSTATE 23505) de l'email d'un compte : course entre le contrôle et l'insertion. */
export const isEmailCollision = (error: unknown): boolean => isUniqueViolationOf(error, USER_EMAIL_UNIQUE_CONSTRAINT)

/** Vrai pour la violation d'unicité de `users.competitor_id` (B-32) : la fiche a déjà un compte. */
export const isCompetitorLinkCollision = (error: unknown): boolean => isUniqueViolationOf(error, USER_COMPETITOR_UNIQUE_CONSTRAINT)
