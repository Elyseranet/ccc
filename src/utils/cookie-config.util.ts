import { SECURE_COOKIE_FALSE_VALUES } from '../consts/auth.const.js'
import type { IAuthCookieConfig } from '../interfaces/auth.interface.js'

/**
 * L3 : `Secure` et le préfixe `__Host-` suivent `runtimeConfig.auth.secureCookie` (NUXT_AUTH_SECURE_COOKIE),
 * jamais `NODE_ENV`. Vrai par défaut : seule une valeur explicitement fausse (`false`, `'false'`, `'0'`)
 * le désactive ; toute valeur absente ou inattendue reste vraie (échec côté sûr).
 */
export const resolveSecureCookie = (auth: IAuthCookieConfig | undefined): boolean => {
  const value = auth?.secureCookie
  if (value === false) {
    return false
  }
  return !(typeof value === 'string' && (SECURE_COOKIE_FALSE_VALUES as readonly string[]).includes(value.trim().toLowerCase()))
}
