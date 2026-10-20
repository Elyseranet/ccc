import { LOG_MAX_VALUE_LENGTH } from '../consts/log.const'

export const truncateLogValue = (value: string, maxLength: number = LOG_MAX_VALUE_LENGTH): string =>
  value.length > maxLength ? value.slice(0, maxLength) : value

/** Chemin seul : sans query string (contrôlée par le client), tronqué. */
export const sanitizeRouteForLog = (path: string | undefined): string | undefined =>
  path === undefined ? undefined : truncateLogValue(path.split('?')[0]!)
