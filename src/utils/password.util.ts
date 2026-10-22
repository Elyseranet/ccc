import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { ScryptOptions } from 'node:crypto'
import { PASSWORD_HASH, PASSWORD_HASH_SEPARATOR, PASSWORD_HASH_PART_COUNT } from '../consts/auth.const.js'

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

/** Format : `scrypt$N$r$p$sel(base64)$clé(base64)`. */
export const hashPassword = async (password: string): Promise<string> => {
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
  try {
    const actual = await deriveKey(password, salt, { ...params, maxmem: PASSWORD_HASH.MAX_MEMORY_BYTES }, expected.length)
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

let dummyHashPromise: Promise<string> | undefined

/**
 * Vérifie contre un hash factice : un email inconnu coûte le même temps qu'un mot de passe faux,
 * ce qui ne laisse pas deviner quels emails existent.
 */
export const burnPasswordCheck = async (password: string): Promise<void> => {
  dummyHashPromise ??= hashPassword(randomBytes(PASSWORD_HASH.SALT_BYTES).toString('hex'))
  await verifyPassword(password, await dummyHashPromise)
}
