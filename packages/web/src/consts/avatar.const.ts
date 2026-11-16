import { AVATAR_MIME_TYPE } from '../enums/avatar.enum.js'

/** Taille maximale de l'image envoyée (B-16). Le même plafond est posé en base par un `check`. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
/** Plus grand côté de l'image stockée, en pixels (sans agrandissement). */
export const AVATAR_MAX_DIMENSION_PX = 512
/** Marge pour l'enveloppe multipart autour des 2 Mio de fichier : frontière, en-têtes de la partie (nom, type) et fin de corps tiennent en quelques centaines d'octets ; 16 Kio laisse une marge large sans rien ouvrir d'utile. */
export const AVATAR_MULTIPART_OVERHEAD_BYTES = 16 * 1024
/** Plafond du corps multipart lu : fichier + enveloppe. */
export const AVATAR_UPLOAD_BODY_MAX_BYTES = AVATAR_MAX_BYTES + AVATAR_MULTIPART_OVERHEAD_BYTES
export const AVATAR_UPLOAD_FIELD = 'file'
/** Plafond de pixels décodés : un PNG de 2 Mo peut déclarer des dimensions énormes (bombe de décompression). */
export const AVATAR_MAX_INPUT_PIXELS = 40_000_000
/**
 * Délai total de lecture du corps multipart (408 au-delà, N3). 30 s, contre 10 s pour le JSON : 2 Mio en 10 s
 * exigeraient 200 Kio/s soutenus, trop strict sur une connexion mobile ; 30 s tolère environ 70 Kio/s et
 * borne toujours un client lent (slowloris). Ne redéfinit pas `API_BODY_READ_TIMEOUT_MS`.
 */
export const AVATAR_UPLOAD_TIMEOUT_MS = 30 * 1000
/** Nombre de caractères du SHA-256 repris dans `?v=`. */
export const AVATAR_VERSION_LENGTH = 16
export const AVATAR_URL_BASE = '/api/v1/competiteurs'

export const AVATAR_CSP = "default-src 'none'"
export const AVATAR_CACHE_IMMUTABLE = 'public, max-age=31536000, immutable'
export const AVATAR_CACHE_REVALIDATE = 'no-cache'

export const MULTIPART_CONTENT_TYPE_PATTERN = /^multipart\/form-data\s*;/i

/** Signatures (octets magiques) : JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, WebP `RIFF....WEBP`. */
export const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
export const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
export const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46]
export const WEBP_MARK = [0x57, 0x45, 0x42, 0x50]
export const WEBP_MARK_OFFSET = 8

/** Format `sharp` correspondant à chaque type stocké (ré-encodage dans le même format). */
export const AVATAR_SHARP_FORMAT = {
  [AVATAR_MIME_TYPE.JPEG]: 'jpeg',
  [AVATAR_MIME_TYPE.PNG]: 'png',
  [AVATAR_MIME_TYPE.WEBP]: 'webp'
} as const
