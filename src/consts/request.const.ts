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

/**
 * N3 : durée totale maximale de lecture d'un corps (anti slowloris). Un corps JSON de 16 Kio tient dans un
 * seul paquet pour un client normal ; 10 s laisse passer un mobile à très faible débit (> 1,6 Kio/s) sans
 * garder une connexion ouverte indéfiniment. C'est un délai TOTAL, pas un délai d'inactivité : un client qui
 * envoie un octet par seconde ne le repousse pas. Au-delà : 408 `REQUEST_TIMEOUT`, connexion fermée.
 * Un envoi plus gros (multipart d'avatar, B-16) passe son propre `timeoutMs` à `readRequestBody`.
 */
export const API_BODY_READ_TIMEOUT_MS = 10 * 1000
