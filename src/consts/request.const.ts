export const REQUEST_ID_HEADER = 'X-Request-Id'
/** Un identifiant fourni par le client n'est repris que s'il a cette forme. */
export const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/
export const API_PREFIX = '/api/'

/**
 * Plafond des corps JSON sous /api (login, PATCH /moi, écritures). Les profils tiennent en quelques
 * centaines d'octets : 16 Kio laisse une large marge. Un envoi multipart (avatar, B-16) a son propre plafond.
 */
export const API_JSON_BODY_MAX_BYTES = 16 * 1024
export const JSON_CONTENT_TYPE_PATTERN = /^application\/(?:[\w.+-]+\+)?json(?:\s*;|$)/i
