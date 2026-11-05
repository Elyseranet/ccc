import { BlockList, isIP } from 'node:net'
import { ACCOUNT_EMAIL_PATTERN } from '../consts/email.const.js'
import { DEVICE_SECRET_MIN_LENGTH } from '../consts/auth.const.js'
import {
  DEFAULT_MAIL_FROM_DOMAIN,
  EMBEDDED_IPV4_FORMS,
  IPV6_BYTE_LENGTH,
  LOCAL_ADDRESS_RANGES,
  LOCAL_HOSTNAME,
  LOCAL_HOSTNAME_SUFFIX,
  MAIL_FROM_DOMAIN_PATTERN,
  MAIL_FROM_NAMED_ADDRESS_PATTERN,
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

/** Les 16 octets d'une IPv6 en écriture hexadécimale (celle que renvoie `URL`), `::` développé. `null` si l'écriture est inattendue. */
const ipv6Bytes = (address: string): number[] | null => {
  const halves = address.split('::')
  if (halves.length > 2) {
    return null
  }
  const groups = (part: string): string[] => (part === '' ? [] : part.split(':'))
  const head = groups(halves[0]!)
  const tail = halves.length === 2 ? groups(halves[1]!) : []
  const missing = halves.length === 2 ? IPV6_BYTE_LENGTH / 2 - head.length - tail.length : 0
  const words = [...head, ...Array<string>(Math.max(missing, 0)).fill('0'), ...tail]
  if (words.length !== IPV6_BYTE_LENGTH / 2 || words.some((word) => !/^[0-9a-f]{1,4}$/.test(word))) {
    return null
  }
  return words.flatMap((word) => [Number.parseInt(word, 16) >> 8, Number.parseInt(word, 16) & 0xff])
}

/**
 * IPv4 embarquée dans une IPv6 NAT64, 6to4 ou IPv4-compatible (`EMBEDDED_IPV4_FORMS`), `null` pour toute autre adresse. Fonction
 * unique : les plages locales et privées s'appliquent à cette IPv4 comme à une IPv4 ordinaire. Les adresses mappées
 * (`::ffff:a.b.c.d`) n'en ont pas besoin, `net.BlockList` les rapproche déjà des plages IPv4.
 */
const embeddedIPv4 = (address: string): string | null => {
  const bytes = ipv6Bytes(address)
  const form = bytes === null ? undefined : EMBEDDED_IPV4_FORMS.find(({ prefix }) => prefix.every((value, index) => bytes[index] === value))
  return bytes === null || form === undefined ? null : bytes.slice(form.ipv4Offset, form.ipv4Offset + 4).join('.')
}

/** Vrai si `hostname` (adresse IP) est dans `ranges`, directement ou par son IPv4 embarquée. */
const inRanges = (hostname: string, ranges: BlockList): boolean => {
  const family = isIP(hostname)
  if (family === 0) {
    return false
  }
  if (ranges.check(hostname, family === 4 ? 'ipv4' : 'ipv6')) {
    return true
  }
  const embedded = family === 6 ? embeddedIPv4(hostname) : null
  return embedded !== null && ranges.check(embedded, 'ipv4')
}

/** Machine locale : `localhost` et `*.localhost`, plages de `LOCAL_ADDRESS_RANGES`, IPv4 mappées ou embarquées comprises. */
const isLocalHostname = (hostname: string): boolean =>
  inRanges(hostname, localRanges) || (isIP(hostname) === 0 && (hostname === LOCAL_HOSTNAME || hostname.endsWith(LOCAL_HOSTNAME_SUFFIX)))

/** Adresse privée ou link-local (IPv4 mappées ou embarquées comprises) : refusée pour le site, acceptée pour le SMTP. */
const isPrivateAddress = (hostname: string): boolean => inRanges(hostname, privateRanges)

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

/**
 * Domaine de l'expéditeur, ou `null` si `from` n'a pas l'une des DEUX formes admises : `adresse` ou `Nom <adresse>`. L'adresse doit
 * valider entièrement `ACCOUNT_EMAIL_PATTERN` et son domaine être un nom d'hôte (`MAIL_FROM_DOMAIN_PATTERN`) : une adresse suivie
 * d'un commentaire ou d'un point-virgule, ou `Nom <adresse> suite`, n'a donc pas de domaine reconnu. Un point final est ignoré.
 */
const mailFromDomain = (from: string): string | null => {
  const address = MAIL_FROM_NAMED_ADDRESS_PATTERN.exec(from)?.[2] ?? from
  if (!ACCOUNT_EMAIL_PATTERN.test(address)) {
    return null
  }
  const domain = address.slice(address.lastIndexOf('@') + 1).replace(/\.$/, '').toLowerCase()
  return MAIL_FROM_DOMAIN_PATTERN.test(domain) ? domain : null
}

/** Échec fermé : un `from` vide, d'une forme non admise, ou sur le domaine par défaut, est une violation. */
const mailFromViolation = (value: unknown): boolean => {
  const domain = mailFromDomain(asText(value))
  return domain === null || domain === DEFAULT_MAIL_FROM_DOMAIN
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
