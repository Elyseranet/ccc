import { createHash } from 'node:crypto'
import { getRequestHeader, sendNoContent, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import type { DataSource } from 'typeorm'
import { DRAW_STATUS } from '../../../shared/enums/draw.enum'
import { EDITION_STATUS } from '../../../shared/enums/edition.enum'
import { MATCH_STATUS } from '../../../shared/enums/match.enum'
import {
  CACHE_CONTROL_OPEN_EDITION,
  DEFAULT_CLOSED_EDITION_MAX_AGE_SECONDS,
  EDITION_ETAG_PREFIX
} from '../../consts/edition.const'
import type { EditionEntity } from '../../database/entities/edition.entity'
import type { IEditionContentStamp, IEditionContentStampRow } from '../../interfaces/edition-query.interface'

/**
 * Empreinte du contenu PUBLIC d'une édition : dernier match validé, nombre de matchs publics,
 * dernier tirage validé, effectif. Un score saisi mais non validé ne la fait pas bouger : l'ETag
 * ne trahit donc pas une saisie (E-f).
 */
export const loadEditionContentStamp = async (
  dataSource: DataSource,
  edition: EditionEntity
): Promise<IEditionContentStamp> => {
  const [row] = await dataSource.query<IEditionContentStampRow[]>(
    `SELECT
       (SELECT MAX(validated_at) FROM matches WHERE edition_id = $1 AND status = ANY($2::match_status[])) AS last_match_validated_at,
       (SELECT COUNT(*) FROM matches WHERE edition_id = $1 AND status = ANY($2::match_status[])) AS public_match_count,
       (SELECT MAX(validated_at) FROM draws WHERE edition_id = $1 AND status = $3::draw_status) AS last_draw_validated_at,
       (SELECT COUNT(*) FROM participations WHERE edition_id = $1) AS participation_count`,
    [edition.id, [MATCH_STATUS.VALIDATED, MATCH_STATUS.RESULT_UNKNOWN], DRAW_STATUS.VALIDATED]
  )
  return {
    status: edition.status,
    lastMatchValidatedAt: row!.last_match_validated_at?.toISOString() ?? null,
    publicMatchCount: Number(row!.public_match_count),
    lastDrawValidatedAt: row!.last_draw_validated_at?.toISOString() ?? null,
    participationCount: Number(row!.participation_count)
  }
}

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
