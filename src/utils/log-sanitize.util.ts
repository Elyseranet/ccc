import { LOG_MAX_VALUE_LENGTH, LOG_SECRET_PATH_PREFIXES, LOG_SECRET_SEGMENT_PLACEHOLDER } from '../consts/log.const.js'

export const truncateLogValue = (value: string, maxLength: number = LOG_MAX_VALUE_LENGTH): string =>
  value.length > maxLength ? value.slice(0, maxLength) : value

/** Remplace le segment secret qui suit un préfixe de `LOG_SECRET_PATH_PREFIXES` (jeton d'invitation). */
const maskSecretSegment = (path: string): string => {
  const normalized = path.replace(/\/{2,}/g, '/')
  const lower = normalized.toLowerCase()
  const prefix = LOG_SECRET_PATH_PREFIXES.find((candidate) => lower.startsWith(candidate))
  if (prefix === undefined) {
    return path
  }
  const rest = normalized.slice(prefix.length)
  const slash = rest.indexOf('/')
  return `${normalized.slice(0, prefix.length)}${LOG_SECRET_SEGMENT_PLACEHOLDER}${slash === -1 ? '' : rest.slice(slash)}`
}

/** Chemin seul : sans query string (contrôlée par le client), segment secret masqué, tronqué. */
export const sanitizeRouteForLog = (path: string | undefined): string | undefined =>
  path === undefined ? undefined : truncateLogValue(maskSecretSegment(path.split('?')[0]!))
