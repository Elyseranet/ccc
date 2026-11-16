import { CSRF_SAFE_METHODS, FETCH_SITE_SAME_ORIGIN } from '../consts/auth.const.js'
import type { ICrossSiteInput } from '../interfaces/auth.interface.js'


export const parseAllowedOrigins = (raw: string): string[] =>
  raw.split(',').map((entry) => entry.trim().replace(/\/+$/, '')).filter((entry) => entry !== '')

/**
 * Défense CSRF en complément de `SameSite=Lax` : une écriture portée par un navigateur doit venir de
 * notre origine. `Origin` fait foi s'il est présent ; sinon `Sec-Fetch-Site`. Sans l'un ni l'autre,
 * la requête ne vient pas d'un navigateur (curl, tests) : un navigateur ne l'omet pas sur une écriture.
 */
export const isCrossSiteWrite = ({ method, origin, secFetchSite, ownOrigin, allowedOrigins }: ICrossSiteInput): boolean => {
  if ((CSRF_SAFE_METHODS as readonly string[]).includes(method.toUpperCase())) {
    return false
  }
  if (origin !== undefined) {
    return origin !== ownOrigin && !allowedOrigins.includes(origin)
  }
  if (secFetchSite !== undefined) {
    return !(FETCH_SITE_SAME_ORIGIN as readonly string[]).includes(secFetchSite)
  }
  return false
}
