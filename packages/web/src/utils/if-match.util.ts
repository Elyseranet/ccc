import { getRequestHeader } from 'h3'
import type { H3Event } from 'h3'
import { IF_MATCH_HEADER, IF_MATCH_VERSION_PATTERN } from '../consts/if-match.const.js'
import { badRequest, preconditionRequired } from './api-error.util.js'

/**
 * Version portée par `If-Match` (contrôle de version obligatoire, SEC-Q). Absent : 428 `PRECONDITION_REQUIRED`.
 * Mal formé : 400. Lecture tolérante : `"3"`, `3` et `W/"3"`.
 */
export const parseRequiredIfMatchVersion = (header: string | undefined): number => {
  if (header === undefined) {
    throw preconditionRequired()
  }
  const found = IF_MATCH_VERSION_PATTERN.exec(header.trim())
  if (!found) {
    throw badRequest('If-Match must carry the resource version')
  }
  return Number(found[1])
}

export const readRequiredIfMatchVersion = (event: H3Event): number =>
  parseRequiredIfMatchVersion(getRequestHeader(event, IF_MATCH_HEADER))
