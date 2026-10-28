import { getQuery, getRequestHeader, setResponseHeader, setResponseStatus } from 'h3'
import type { H3Event } from 'h3'
import {
  AVATAR_CACHE_IMMUTABLE,
  AVATAR_CACHE_REVALIDATE,
  AVATAR_CSP,
  AVATAR_VERSION_LENGTH
} from '../consts/avatar.const.js'
import type { IStoredAvatar } from '../interfaces/avatar.interface.js'

/** `If-None-Match` peut porter une liste, des validateurs faibles (`W/`) ou `*`. */
const matchesEtag = (header: string | undefined, etag: string): boolean =>
  header !== undefined && header.split(',').some((candidate) => {
    const value = candidate.trim().replace(/^W\//, '')
    return value === '*' || value === etag
  })

/**
 * Pose les en-têtes de service d'un avatar (type détecté, `nosniff`, CSP, ETag, cache) et renvoie les octets,
 * ou un 304 si l'ETag correspond. `immutable` seulement quand `?v=` est la bonne empreinte : l'URL change avec le contenu.
 */
export const serveAvatar = (event: H3Event, avatar: IStoredAvatar): Buffer | string => {
  const etag = `"${avatar.sha256}"`
  const version = getQuery(event).v
  const isVersioned = version === avatar.sha256.slice(0, AVATAR_VERSION_LENGTH)

  setResponseHeader(event, 'ETag', etag)
  setResponseHeader(event, 'Cache-Control', isVersioned ? AVATAR_CACHE_IMMUTABLE : AVATAR_CACHE_REVALIDATE)
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'Content-Security-Policy', AVATAR_CSP)
  setResponseHeader(event, 'Content-Disposition', 'inline')

  if (matchesEtag(getRequestHeader(event, 'if-none-match'), etag)) {
    setResponseStatus(event, 304)
    return ''
  }
  setResponseHeader(event, 'Content-Type', avatar.mimeType)
  return avatar.content
}
