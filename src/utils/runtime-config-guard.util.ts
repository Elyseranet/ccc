import { BlockList, isIP } from 'node:net'
import { DEVICE_SECRET_MIN_LENGTH } from '../consts/auth.const.js'
import {
  DEFAULT_MAIL_FROM_DOMAIN,
  LOCAL_ADDRESS_RANGES,
  LOCAL_HOSTNAME,
  LOCAL_HOSTNAME_SUFFIX,
  PRIVATE_ADDRESS_RANGES,
  STRICT_CONFIG_VARIABLE,
  STRICT_RUNTIME_CONFIG_OFF_VALUES
} from '../consts/runtime-config.const.js'
import type { IStrictRuntimeConfigInput } from '../interfaces/runtime-config.interface.js'
import { resolveSecureCookie } from './cookie-config.util.js'

const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const localRanges = new BlockList()
for (const { network, prefix, family } of LOCAL_ADDRESS_RANGES) {
  localRanges.addSubnet(network, prefix, family)
}

const privateRanges = new BlockList()
for (const { network, prefix, family } of PRIVATE_ADDRESS_RANGES) {
  privateRanges.addSubnet(network, prefix, family)
}

/**
 * Hôte normalisé par `URL` (minuscules, formes numériques `127.1` ou `2130706433` ramenées à `127.0.0.1`), sans point final
 * ni crochets IPv6. Vide si l'hôte n'est pas analysable.
 */
const normalizeHostname = (host: string): string => {
  try {
    // Une IPv6 sans crochets (valeur de NUXT_MAIL_HOST acceptée par nodemailer) n'est pas une URL valide : on la met entre crochets.
    const authority = isIP(host) === 6 ? `[${host}]` : host
    return new URL(`smtp://${authority}`).hostname.replace(/^\[|\]$/g, '').replace(/\.+$/, '').toLowerCase()
  } catch {
    return ''
  }
}

/** Machine locale : `localhost` et `*.localhost`, plages de `LOCAL_ADDRESS_RANGES`, IPv4 mappées comprises. */
const isLocalHostname = (hostname: string): boolean => {
  const family = isIP(hostname)
  if (family !== 0) {
    return localRanges.check(hostname, family === 4 ? 'ipv4' : 'ipv6')
  }
  return hostname === LOCAL_HOSTNAME || hostname.endsWith(LOCAL_HOSTNAME_SUFFIX)
}

/** Adresse privée ou link-local (IPv4 mappées comprises) : refusée pour le site, acceptée pour le SMTP. */
const isPrivateAddress = (hostname: string): boolean => {
  const family = isIP(hostname)
  return family !== 0 && privateRanges.check(hostname, family === 4 ? 'ipv4' : 'ipv6')
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
    const hostname = normalizeHostname(url.host)
    return url.protocol !== 'https:' || isLocalHostname(hostname) || isPrivateAddress(hostname)
  } catch {
    return true
  }
}

/**
 * Un hôte SMTP vide, non analysable, local (même normalisation que le site : `localhost.`, `[::ffff:127.0.0.1]`, `127.0.0.2`…)
 * ou un nom sans point (nom de service comme `mailpit`) n'est pas un serveur réel. Une adresse IP publique reste acceptée.
 */
const smtpHostViolation = (value: unknown): boolean => {
  const host = normalizeHostname(asText(value))
  if (host === '' || isLocalHostname(host)) {
    return true
  }
  return isIP(host) === 0 && !host.includes('.')
}

/** Adresse de l'expéditeur, avec ou sans nom affiché (`CCC <no-reply@ccc.local>`) : domaine exact, sans `>` ni point final. */
const mailFromDomain = (from: string): string => {
  const address = /<([^<>]*)>\s*$/.exec(from)?.[1] ?? from
  return address.slice(address.lastIndexOf('@') + 1).trim().replace(/\.+$/, '').toLowerCase()
}

const mailFromViolation = (value: unknown): boolean => {
  const from = asText(value)
  return from === '' || mailFromDomain(from) === DEFAULT_MAIL_FROM_DOMAIN
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
    problems.push(`${STRICT_CONFIG_VARIABLE.SITE_URL} must be a public https URL (no localhost, private or link-local address)`)
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
