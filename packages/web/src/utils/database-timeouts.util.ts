import {
  DATABASE_TIMEOUT_DEFAULTS,
  DATABASE_TIMEOUT_ENV_VARIABLES,
  DATABASE_TIMEOUT_MAX_MS,
  DATABASE_TIMEOUT_MESSAGES,
  PG_QUERY_CANCELED
} from '../consts/database-config.const.js'
// Chargé par la DataSource de la CLI (migrations dans l'image) : aucune dépendance serveur (h3), voir cli-dependencies.test.ts.
import type { IDatabaseTimeouts, IResolvedDatabaseTimeouts } from '../interfaces/database-config.interface.js'

/** Entier de 0 à 600000 (0 = pas de délai). Une valeur absente ou vide garde le défaut sans être « invalide ». */
const parseTimeout = (raw: unknown): number | 'absent' | 'invalid' => {
  if (raw === undefined || raw === null || raw === '') {
    return 'absent'
  }
  const value = typeof raw === 'string' ? (/^\d{1,7}$/.test(raw.trim()) ? Number(raw.trim()) : Number.NaN) : raw
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= DATABASE_TIMEOUT_MAX_MS ? value : 'invalid'
}

/**
 * Résout les trois délais. Une valeur invalide garde le défaut ; la liste des variables fautives (leurs NOMS, jamais leurs
 * valeurs) permet à l'appelant de le journaliser. `scope` choisit les défauts : le serveur borne tout, la CLI (migrations,
 * seed) ne borne que la connexion.
 */
export const resolveDatabaseTimeouts = (
  raw: Partial<Record<keyof IDatabaseTimeouts, unknown>>,
  scope: 'runtime' | 'cli'
): IResolvedDatabaseTimeouts => {
  const invalidVariables: string[] = []
  const timeouts = { ...DATABASE_TIMEOUT_DEFAULTS[scope] } as IDatabaseTimeouts
  for (const field of Object.keys(DATABASE_TIMEOUT_DEFAULTS[scope]) as Array<keyof IDatabaseTimeouts>) {
    const parsed = parseTimeout(raw[field])
    if (parsed === 'invalid') {
      invalidVariables.push(DATABASE_TIMEOUT_ENV_VARIABLES[scope][field])
    } else if (parsed !== 'absent') {
      timeouts[field] = parsed
    }
  }
  return { timeouts, invalidVariables }
}

/** Remonte la chaîne `cause` / `driverError` (TypeORM enveloppe l'erreur du pilote). */
const errorChain = (error: unknown): Array<{ code?: unknown, message?: unknown }> => {
  const chain: Array<{ code?: unknown, message?: unknown }> = []
  let current: unknown = error
  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth += 1) {
    chain.push(current as { code?: unknown, message?: unknown })
    const link = current as { driverError?: unknown, cause?: unknown }
    current = link.driverError ?? link.cause
  }
  return chain
}

/**
 * Délai de la base : instruction annulée par `statement_timeout` (SQLSTATE 57014), ou erreur de délai du pilote `pg`
 * (connexion, lecture). Les autres erreurs de la base restent des erreurs ordinaires.
 */
export const isDatabaseTimeout = (error: unknown): boolean =>
  errorChain(error).some((link) =>
    link.code === PG_QUERY_CANCELED || (typeof link.message === 'string' && DATABASE_TIMEOUT_MESSAGES.includes(link.message)))
