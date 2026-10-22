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

/**
 * En-tête de la chaîne de proxys. Il n'est lu que si `runtimeConfig.trustProxyHops` (NUXT_TRUST_PROXY_HOPS) est
 * strictement positif : sinon un client le forgerait pour changer d'IP à volonté et contourner les limites de débit.
 */
export const FORWARDED_FOR_HEADER = 'x-forwarded-for'
/** Plafond de `trustProxyHops` : au-delà, la configuration est sans doute fausse et le démarrage la refuse. */
export const TRUST_PROXY_HOPS_MAX = 5
/**
 * Plages d'où peut venir un proxy de confiance : boucle locale et réseaux privés (le proxy de Coolify joint le conteneur
 * par le réseau Docker). `X-Forwarded-For` n'est lu que si l'adresse de la socket est dans ces plages : un client qui
 * joindrait le conteneur directement depuis Internet ne peut pas choisir son IP.
 */
export const TRUSTED_PROXY_SUBNETS: ReadonlyArray<{ readonly network: string, readonly prefix: number, readonly family: 'ipv4' | 'ipv6' }> = [
  { network: '127.0.0.0', prefix: 8, family: 'ipv4' },
  { network: '10.0.0.0', prefix: 8, family: 'ipv4' },
  { network: '172.16.0.0', prefix: 12, family: 'ipv4' },
  { network: '192.168.0.0', prefix: 16, family: 'ipv4' },
  { network: '::1', prefix: 128, family: 'ipv6' },
  { network: 'fc00::', prefix: 7, family: 'ipv6' }
]
