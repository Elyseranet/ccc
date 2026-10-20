export const SESSION_COOKIE_NAME = 'ccc_session'
/** En production : préfixe `__Host-` (OWASP Session Management) qui impose Secure, Path=/ et aucun Domain. */
export const SESSION_COOKIE_NAME_PRODUCTION = `__Host-${SESSION_COOKIE_NAME}`

/** SEC-A1 : expiration à l'inactivité (2 h sans requête authentifiée) et expiration absolue (12 h après la création). */
export const SESSION_IDLE_TIMEOUT_SECONDS = 2 * 60 * 60
export const SESSION_ABSOLUTE_TIMEOUT_SECONDS = 12 * 60 * 60

/** `last_seen_at` n'est réécrit qu'au plus une fois par minute, pour ne pas écrire à chaque requête. */
export const SESSION_TOUCH_INTERVAL_MS = 60 * 1000

/** Une session expirée est supprimée après ce délai de grâce. */
export const SESSION_PURGE_GRACE_MS = 24 * 60 * 60 * 1000

/** Octets d'entropie du jeton de session (256 bits). */
export const SESSION_TOKEN_BYTES = 32

/**
 * scrypt. Profil N=2^16, r=8, p=2 (64 MiB), un des profils listés par l'OWASP Password Storage Cheat Sheet
 * (https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html, consultée le 2026-10-20).
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

/**
 * Minimum 15 : l'OWASP Authentication Cheat Sheet juge faible un mot de passe de moins de 15 caractères sans MFA
 * (https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), et la Spec ne prévoit pas de MFA.
 * Maximum 128 (OWASP demande au moins 64).
 */
export const PASSWORD_MIN_LENGTH = 15
export const PASSWORD_MAX_LENGTH = 128

export const EMAIL_MAX_LENGTH = 254
export const PHONE_MAX_LENGTH = 32
export const PHONE_PATTERN = /^\+?[0-9 .()-]{6,32}$/
export const AVATAR_URL_MAX_LENGTH = 2048

export const RATE_LIMIT_AUTH_ROUTE_KEY = {
  LOGIN_IP: 'auth-login-ip',
  LOGIN_THROTTLED: 'auth-login-throttled',
  CHANGE_PASSWORD: 'auth-change-password'
} as const

export const CSRF_SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'] as const
export const FETCH_SITE_SAME_ORIGIN = ['same-origin', 'none'] as const

export const PASSWORD_CHANGE_MAX_ATTEMPTS = 5
export const AVATAR_ALLOWED_PROTOCOLS = ['https:']

/**
 * SEC-A2 : ralentissement progressif par compte, sans blocage dur. Aucun délai jusqu'à 5 échecs
 * consécutifs ; au-delà, 2^(échecs − 5) secondes, plafonné à 300 s (5 minutes).
 */
export const LOGIN_FREE_FAILURES = 5
export const LOGIN_DELAY_BASE_SECONDS = 2
export const LOGIN_DELAY_MAX_SECONDS = 300
