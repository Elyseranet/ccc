import { createHash } from 'node:crypto'
import { getRequestHeader, sendNoContent, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import type { DataSource } from 'typeorm'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import {
  CACHE_CONTROL_OPEN_EDITION,
  DEFAULT_CLOSED_EDITION_MAX_AGE_SECONDS,
  EDITION_ETAG_PREFIX
} from '../consts/edition.const.js'
import type { EditionEntity } from '../server/db/typeorm/entities/edition.entity.js'
import { loadEditionContentStamp } from '../services/edition.service.js'
import type { IEditionContentStamp } from '../interfaces/edition-query.interface.js'

/** Un ETag par ressource : l'URL (chemin et requête) entre dans l'empreinte. */
export const buildEditionEtag = (edition: EditionEntity, stamp: IEditionContentStamp, path: string): string => {
  const digest = createHash('sha256')
    .update(JSON.stringify([edition.id, edition.closedAt?.toISOString() ?? null, stamp, path]))
    .digest('base64url')
    .slice(0, 27)
  return `"${EDITION_ETAG_PREFIX}-${digest}"`
}

const stripWeakPrefix = (tag: string): string => tag.trim().replace(/^W\//, '')

/** Comparaison faible (RFC 9110 §13.1.2) : suffisante pour un GET conditionnel. */
export const matchesIfNoneMatch = (header: string | undefined, etag: string): boolean => {
  if (!header) {
    return false
  }
  if (header.trim() === '*') {
    return true
  }
  return header.split(',').some((candidate) => stripWeakPrefix(candidate) === etag)
}

const closedEditionMaxAge = (): number => {
  const configured = Number(useRuntimeConfig().cache?.closedEditionMaxAgeSeconds)
  return Number.isInteger(configured) && configured >= 0 ? configured : DEFAULT_CLOSED_EDITION_MAX_AGE_SECONDS
}

/**
 * Deux régimes sur une même route (Spec API) :
 * - édition CLOSED : ETag fort et `Cache-Control: public, max-age` (valeur dans runtimeConfig) ;
 * - édition en cours : ETag faible et `Cache-Control: no-cache`, donc revalidation à chaque lecture.
 * Renvoie true si la 304 est déjà partie : le handler doit alors s'arrêter.
 */
export const applyEditionCache = async (
  event: H3Event,
  dataSource: DataSource,
  edition: EditionEntity
): Promise<boolean> => {
  const stamp = await loadEditionContentStamp(dataSource, edition)
  const closed = edition.status === EDITION_STATUS.CLOSED
  const strongEtag = buildEditionEtag(edition, stamp, event.path)
  const etag = closed ? strongEtag : `W/${strongEtag}`

  setResponseHeader(event, 'ETag', etag)
  setResponseHeader(
    event,
    'Cache-Control',
    closed ? `public, max-age=${closedEditionMaxAge()}` : CACHE_CONTROL_OPEN_EDITION
  )

  if (matchesIfNoneMatch(getRequestHeader(event, 'if-none-match'), strongEtag)) {
    await sendNoContent(event, 304)
    return true
  }
  return false
}
