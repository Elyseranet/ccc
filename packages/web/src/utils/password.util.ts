import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { ScryptOptions } from 'node:crypto'
import { PASSWORD_HASH, PASSWORD_HASH_DEFAULT_CONCURRENCY, PASSWORD_HASH_MAX_CONCURRENCY, PASSWORD_HASH_PART_COUNT, PASSWORD_HASH_RETRY_AFTER_SECONDS, PASSWORD_HASH_SEPARATOR } from '../consts/auth.const.js'
import { serviceBusy } from './api-error.util.js'
import { ConcurrencyGate } from './concurrency-gate.util.js'

const deriveKey = (password: string, salt: Buffer, options: ScryptOptions, keyLength: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, keyLength, options, (error, key) => {
      if (error) {
        reject(error)
      } else {
        resolve(key)
      }
    })
  })

/**
 * L2 : sémaphore global sur scrypt (un calcul = un thread libuv + 64 Mio). Pas de file d'attente : au-delà de
 * la limite, 503 `SERVICE_BUSY` avec `Retry-After`, ce qui garde le pool libre pour le reste du serveur.
 * La limite vient de `runtimeConfig.auth.passwordHashConcurrency` (plugin auth-config).
 */
const hashGate = new ConcurrencyGate(PASSWORD_HASH_DEFAULT_CONCURRENCY)

export const configurePasswordHashConcurrency = (value: unknown): number => {
  const limit = Number(value)
  if (!Number.isInteger(limit) || limit < 1 || limit > PASSWORD_HASH_MAX_CONCURRENCY) {
    throw new Error(`NUXT_AUTH_PASSWORD_HASH_CONCURRENCY must be an integer between 1 and ${PASSWORD_HASH_MAX_CONCURRENCY}`)
  }
  hashGate.setLimit(limit)
  return limit
}

/** Contrôle non contraignant : permet à login de refuser AVANT de réserver une tentative (sinon un 503 compterait comme un échec). */
export const assertPasswordHashCapacity = (): void => {
  if (!hashGate.hasCapacity()) {
    throw serviceBusy(PASSWORD_HASH_RETRY_AFTER_SECONDS)
  }
}

const gated = async <T>(task: () => Promise<T>): Promise<T> => {
  const outcome = await hashGate.tryRun(task)
  if (!outcome.ran) {
    throw serviceBusy(PASSWORD_HASH_RETRY_AFTER_SECONDS)
  }
  return outcome.value
}

/** Format : `scrypt$N$r$p$sel(base64)$clé(base64)`. */
const computeHash = async (password: string): Promise<string> => {
  const salt = randomBytes(PASSWORD_HASH.SALT_BYTES)
  const key = await deriveKey(password, salt, {
    N: PASSWORD_HASH.COST,
    r: PASSWORD_HASH.BLOCK_SIZE,
    p: PASSWORD_HASH.PARALLELISM,
    maxmem: PASSWORD_HASH.MAX_MEMORY_BYTES
  }, PASSWORD_HASH.KEY_LENGTH)
  return [
    PASSWORD_HASH.ALGORITHM,
    PASSWORD_HASH.COST,
    PASSWORD_HASH.BLOCK_SIZE,
    PASSWORD_HASH.PARALLELISM,
    salt.toString('base64'),
    key.toString('base64')
  ].join(PASSWORD_HASH_SEPARATOR)
}

export const hashPassword = (password: string): Promise<string> => gated(() => computeHash(password))

/** Comparaison en temps constant. Un hash mal formé ou absent donne `false`, jamais une exception. */
export const verifyPassword = async (password: string, stored: string | null | undefined): Promise<boolean> => {
  if (!stored) {
    return false
  }
  const parts = stored.split(PASSWORD_HASH_SEPARATOR)
  if (parts.length !== PASSWORD_HASH_PART_COUNT || parts[0] !== PASSWORD_HASH.ALGORITHM) {
    return false
  }
  const [, cost, blockSize, parallelism, saltB64, keyB64] = parts as [string, string, string, string, string, string]
  const expected = Buffer.from(keyB64, 'base64')
  const salt = Buffer.from(saltB64, 'base64')
  const params = { N: Number(cost), r: Number(blockSize), p: Number(parallelism) }
  if (expected.length === 0 || salt.length === 0 || !Object.values(params).every((value) => Number.isInteger(value) && value > 0)) {
    return false
  }
  // Le sémaphore est hors du try : un 503 ne doit pas devenir un « mot de passe faux ».
  return gated(async () => {
    try {
      const actual = await deriveKey(password, salt, { ...params, maxmem: PASSWORD_HASH.MAX_MEMORY_BYTES }, expected.length)
      return timingSafeEqual(actual, expected)
    } catch {
      return false
    }
  })
}

let dummyHashPromise: Promise<string> | undefined

/**
 * Vérifie contre un hash factice : un email inconnu coûte le même temps qu'un mot de passe faux,
 * ce qui ne laisse pas deviner quels emails existent.
 */
export const burnPasswordCheck = async (password: string): Promise<void> => {
  // Calcul unique et mis en cache : hors sémaphore, pour qu'un refus 503 ne reste pas en cache.
  dummyHashPromise ??= computeHash(randomBytes(PASSWORD_HASH.SALT_BYTES).toString('hex'))
  await verifyPassword(password, await dummyHashPromise)
}
