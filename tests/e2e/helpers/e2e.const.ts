import { resolve } from 'node:path'

/** Jetons des sessions de test écrits par `prepare-database.ts` (dossier gitignoré). */
export const E2E_SESSIONS_FILE = resolve('test-results', 'e2e-sessions.json')

export const E2E_TEST_DATABASE_SUFFIX = '_test'

/** Nom du cookie de session hors production (`SESSION_COOKIE_NAME`) : les e2e tournent sur `nuxt dev`. */
export const E2E_SESSION_COOKIE = 'ccc_session'

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`

/**
 * Marges de l'aplat de valeur dans la boîte du champ (F-14, M1), identiques côté maquette et côté application :
 * `left` = padding gauche 20 px + filet 1 px ; `right` = padding droit 40 px + filet 1 px (le chevron de la maquette
 * est à 22 px du bord droit, il reste donc visible) ; `vertical` = marge haute et basse, pour laisser filet et arcs.
 */
export const VALUE_MASK_INSETS = { left: 21, right: 41, vertical: 6 }
