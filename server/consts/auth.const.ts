export const SESSION_COOKIE_NAME = 'ccc_session'

/** Durée de vie d'une session : 14 jours, sans prolongation (pas de session éternelle). */
export const SESSION_TTL_SECONDS = 14 * 24 * 60 * 60

/** `last_seen_at` n'est réécrit qu'au plus une fois par minute, pour ne pas écrire à chaque requête. */
export const SESSION_TOUCH_INTERVAL_MS = 60 * 1000

/** Une session expirée est supprimée après ce délai de grâce. */
export const SESSION_PURGE_GRACE_MS = 24 * 60 * 60 * 1000

/** Octets d'entropie du jeton de session (256 bits). */
export const SESSION_TOKEN_BYTES = 32

/**
 * scrypt. Profil N=2^16, r=8, p=2 (64 MiB, un des profils de la fiche OWASP « Password Storage »).
 * Les paramètres sont écrits dans le hash : on peut les relever plus tard sans invalider les anciens.
 */
export const PASSWORD_HASH = {
  ALGORITHM: 'scrypt',
  COST: 65536,
  BLOCK_SIZE: 8,
  PARALLELISM: 2,
  KEY_LENGTH: 64,
  SALT_BYTES: 16,
  MAX_MEMORY_BYTES: 128 * 1024 * 1024
} as const

/** Politique de longueur : non spécifiée par la Spec, valeur proposée (NIST SP 800-63B : minimum 8, 12 ici) à valider en revue. */
export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128

export const EMAIL_MAX_LENGTH = 254
export const PHONE_MAX_LENGTH = 32
export const PHONE_PATTERN = /^\+?[0-9 .()-]{6,32}$/
export const AVATAR_URL_MAX_LENGTH = 2048

export const RATE_LIMIT_AUTH_ROUTE_KEY = {
  LOGIN_IP: 'auth-login-ip',
  LOGIN_EMAIL: 'auth-login-email',
  CHANGE_PASSWORD: 'auth-change-password'
} as const

export const CSRF_SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'] as const
export const FETCH_SITE_SAME_ORIGIN = ['same-origin', 'none'] as const

export const PASSWORD_CHANGE_MAX_ATTEMPTS = 5
export const AVATAR_ALLOWED_PROTOCOLS = ['https:', 'http:']
