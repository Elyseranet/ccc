import {
  LOCAL_HOSTNAMES,
  STRICT_CONFIG_VARIABLE,
  STRICT_RUNTIME_CONFIG_OFF_VALUES
} from '../consts/runtime-config.const.js'
import type { IStrictRuntimeConfigInput } from '../interfaces/runtime-config.interface.js'

const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const isLocalHostname = (hostname: string): boolean =>
  (LOCAL_HOSTNAMES as readonly string[]).includes(hostname.toLowerCase())

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

/**
 * Garde-fou de configuration de production (PROD-1). Avec `strictRuntimeConfig` vrai, lève une erreur qui nomme chaque
 * variable fautive, JAMAIS sa valeur, si : le site n'est pas en https ou désigne localhost ; le transport d'email
 * n'est pas `smtp` ; l'hôte SMTP est local (ou vide) ; l'expéditeur est vide. Sans l'indicateur, ne fait rien.
 * Fonction pure et autonome : le plugin Nitro et `user:create-admin` l'appellent tous les deux.
 * Aucun contournement : pas de mode recette.
 */
export const assertStrictRuntimeConfig = (config: IStrictRuntimeConfigInput): void => {
  if (!isStrictRuntimeConfig(config.strictRuntimeConfig)) {
    return
  }
  const problems: string[] = []
  if (siteUrlViolation(config.public?.siteUrl)) {
    problems.push(`${STRICT_CONFIG_VARIABLE.SITE_URL} must be an https URL that does not point to localhost`)
  }
  if (asText(config.mail?.transport) !== 'smtp') {
    problems.push(`${STRICT_CONFIG_VARIABLE.MAIL_TRANSPORT} must be "smtp"`)
  }
  const host = asText(config.mail?.host)
  if (host === '' || isLocalHostname(host)) {
    problems.push(`${STRICT_CONFIG_VARIABLE.MAIL_HOST} must name a real SMTP server, not localhost`)
  }
  if (asText(config.mail?.from) === '') {
    problems.push(`${STRICT_CONFIG_VARIABLE.MAIL_FROM} must not be empty`)
  }
  if (problems.length > 0) {
    throw new Error(`Invalid production configuration (NUXT_STRICT_RUNTIME_CONFIG is on): ${problems.join('; ')}`)
  }
}
