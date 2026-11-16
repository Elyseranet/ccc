/** Longueur maximale d'une valeur issue du client ou d'une erreur écrite dans les logs. */
export const LOG_MAX_VALUE_LENGTH = 200

/**
 * Routes dont un segment du chemin est un secret (jeton d'invitation, B-09) : dans les logs, le segment qui suit le
 * préfixe est remplacé par `LOG_SECRET_SEGMENT_PLACEHOLDER`. Comparaison insensible à la casse, barres obliques répétées
 * ramenées à une seule, pour qu'une variante d'URL (404) ne fasse pas fuiter un jeton.
 */
export const LOG_SECRET_PATH_PREFIXES = ['/api/v1/auth/invitation/'] as const
export const LOG_SECRET_SEGMENT_PLACEHOLDER = ':token'
