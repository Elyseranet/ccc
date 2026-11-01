import { DEVICE_SECRET_MIN_LENGTH } from '../consts/auth.const.js'
import {
  DEFAULT_MAIL_FROM_DOMAIN,
  LOCAL_HOSTNAME_SUFFIX,
  LOCAL_HOSTNAMES,
  STRICT_CONFIG_VARIABLE,
  STRICT_RUNTIME_CONFIG_OFF_VALUES
} from '../consts/runtime-config.const.js'
import type { IStrictRuntimeConfigInput } from '../interfaces/runtime-config.interface.js'
import { resolveSecureCookie } from './cookie-config.util.js'

const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

/** `localhost`, `127.0.0.1`, `::1`, `[::1]`, `0.0.0.0` et tout `*.localhost`. */
const isLocalHostname = (hostname: string): boolean => {
  const lower = hostname.toLowerCase()
  return (LOCAL_HOSTNAMES as readonly string[]).includes(lower) || lower.endsWith(LOCAL_HOSTNAME_SUFFIX)
}

/** Mode strict actif ? Faux par défaut ; seules `false`, `0` ou la chaîne vide l'éteignent explicitement. */
export const isStrictRuntimeConfig = (value: unknown): boolean => {
  if (value === undefined || value === null || value === false) {
    return false
  }
  if (typeof value === 'string') {
    return !(STRICT_RUNTIME_CONFIG_OFF_VALUES as readonly string[]).includes(value.trim().toLowerCase())
  }
  return Boolean(value)
}

const siteUrlViolation = (value: unknown): boolean => {
  try {
    const url = new URL(asText(value))
    return url.protocol !== 'https:' || isLocalHostname(url.hostname)
  } catch {
    return true
  }
}

/** Un hôte SMTP vide, local, ou sans point (nom de service comme `mailpit`) n'est pas un serveur réel. */
const smtpHostViolation = (value: unknown): boolean => {
  const host = asText(value)
  return host === '' || isLocalHostname(host) || !host.includes('.')
}

const mailFromViolation = (value: unknown): boolean => {
  const from = asText(value)
  return from === '' || from.toLowerCase().includes(DEFAULT_MAIL_FROM_DOMAIN)
}

/**
 * Garde-fou de configuration de production (PROD-1, T-SEC-06, T-SEC-12). Fonction pure et autonome : le plugin Nitro
 * et `user:create-admin` l'appellent tous les deux.
 *
 * - Dans l'image de production (`productionImage`, marqueur du Dockerfile), le mode strict ne peut pas être éteint :
 *   `NUXT_STRICT_RUNTIME_CONFIG` éteint ou absent fait échouer le démarrage. Hors image, il reste faux par défaut.
 * - En mode strict, l'erreur nomme chaque variable fautive, JAMAIS sa valeur : site (`NUXT_PUBLIC_SITE_URL`) pas en
 *   https ou sur une machine locale ; transport d'email différent de `smtp` ; hôte SMTP vide, local ou sans point ;
 *   expéditeur vide ou resté à la valeur par défaut ; cookies sans `Secure` ; secret du cookie d'appareil absent ou
 *   trop court.
 * - Les identifiants SMTP (`NUXT_MAIL_USER`, `NUXT_MAIL_PASSWORD`) ne sont pas exigés : le fournisseur n'est pas choisi
 *   et certains relais n'authentifient pas.
 */
export const assertStrictRuntimeConfig = (config: IStrictRuntimeConfigInput): void => {
  const strict = isStrictRuntimeConfig(config.strictRuntimeConfig)
  if (config.productionImage === true && !strict) {
    throw new Error(`${STRICT_CONFIG_VARIABLE.STRICT} cannot be turned off in the production image`)
  }
  if (!strict) {
    return
  }
  const problems: string[] = []
  if (siteUrlViolation(config.public?.siteUrl)) {
    problems.push(`${STRICT_CONFIG_VARIABLE.SITE_URL} must be an https URL that does not point to localhost`)
  }
  if (asText(config.mail?.transport) !== 'smtp') {
    problems.push(`${STRICT_CONFIG_VARIABLE.MAIL_TRANSPORT} must be "smtp"`)
  }
  if (smtpHostViolation(config.mail?.host)) {
    problems.push(`${STRICT_CONFIG_VARIABLE.MAIL_HOST} must name a real SMTP server (a fully qualified name), not localhost or a bare service name`)
  }
  if (mailFromViolation(config.mail?.from)) {
    problems.push(`${STRICT_CONFIG_VARIABLE.MAIL_FROM} must be set to a real sender, not the default`)
  }
  if (!resolveSecureCookie(config.auth)) {
    problems.push(`${STRICT_CONFIG_VARIABLE.SECURE_COOKIE} must not be turned off`)
  }
  if (asText(config.auth?.deviceCookieSecret).length < DEVICE_SECRET_MIN_LENGTH) {
    problems.push(`${STRICT_CONFIG_VARIABLE.DEVICE_COOKIE_SECRET} is required (at least ${DEVICE_SECRET_MIN_LENGTH} characters)`)
  }
  if (problems.length > 0) {
    throw new Error(`Invalid production configuration (${STRICT_CONFIG_VARIABLE.STRICT} is on): ${problems.join('; ')}`)
  }
}
