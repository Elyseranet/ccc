/** A14 : durée de validité d'un lien de première connexion. */
export const INVITATION_TTL_DAYS = 7
export const INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000

/** Contrainte d'unicité de l'email : une collision concurrente est traduite en 409. */
export const USER_EMAIL_UNIQUE_CONSTRAINT = 'uq_users_email'
/** Code SQLSTATE PostgreSQL d'une violation d'unicité. */
export const PG_UNIQUE_VIOLATION = '23505'

/** Nom, prénom, pseudo : colonnes `varchar(80)`. Les caractères de contrôle (\p{C}) sont refusés. */
export const IDENTITY_NAME_MAX_LENGTH = 80
export const IDENTITY_NAME_PATTERN = /^[^\p{C}]+$/u

/** Octets d'entropie du jeton d'invitation (256 bits), encodés en base64url : 43 caractères. */
export const INVITATION_TOKEN_BYTES = 32
export const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
/** Chemin du lien de première connexion côté front (`ROUTES.INVITATION`) : `<siteUrl>/invitation/<jeton>`. */
export const INVITATION_LINK_PATH = '/invitation/'

export const SITE_URL_ERROR = 'public.siteUrl (NUXT_PUBLIC_SITE_URL) must be an absolute http(s) URL'
