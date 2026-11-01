import { resolve } from 'node:path'
import { getSessionCookieName } from '../../../src/utils/session-token.util'

/** Jetons des sessions de test écrits par `prepare-database.ts` (dossier gitignoré). */
export const E2E_SESSIONS_FILE = resolve('test-results', 'e2e-sessions.json')

export const E2E_TEST_DATABASE_SUFFIX = '_test'

/**
 * Les e2e tournent sur `nuxt dev` en HTTP : `playwright.config.ts` démarre le serveur avec
 * `NUXT_AUTH_SECURE_COOKIE=${E2E_SECURE_COOKIE}` (L3, T-SEC-04 : sinon le défaut `true` donne `__Host-ccc_session`).
 * Le nom du cookie est dérivé de la même fonction que le serveur, pour la même valeur : il ne peut pas diverger.
 */
export const E2E_SECURE_COOKIE = false
export const E2E_SESSION_COOKIE = getSessionCookieName({ secureCookie: String(E2E_SECURE_COOKIE) })

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`

/**
 * Marges de l'aplat de valeur dans la boîte du champ (F-14, M1), identiques côté maquette et côté application :
 * `left` = padding gauche 20 px + filet 1 px ; `right` = padding droit 40 px + filet 1 px (le chevron de la maquette
 * est à 22 px du bord droit, il reste donc visible) ; `vertical` = marge haute et basse, pour laisser filet et arcs.
 */
export const VALUE_MASK_INSETS = { left: 21, right: 41, vertical: 6 }

/*********************************************************
 * Édition en cours dans la base de test (QA-2, T-QA-03)
 *
 * @description
 * Le dump d'archives clôture les 16 éditions, 2026 comprise. La préparation de la base remet 2026 en phase de poules, une
 * seule fois et pour tous les tests. La règle : l'édition passe en `POOLS_PLAYING`, le tour de poules en `PLAYING`, les
 * autres tours en `PENDING` ; leurs matchs repassent à « programmé » sans score ; pour chaque poule, la fraction
 * `numérateur / dénominateur` de ses matchs (les derniers par numéro de séquence, arrondi à l'inférieur) repasse aussi à
 * « programmé » ; les participations perdent leur issue (étape finale, points, rang de poule). Aucune ligne n'est créée ni supprimée.
 * Avec les poules de 2026 (21, 15, 21 et 15 matchs) et un tiers, 24 matchs de poule sur 72 sont à jouer : 48 validés.
 ********************************************************/
export const E2E_IN_PROGRESS_EDITION_CODE = '2026'

export const E2E_POOL_REWIND_NUMERATOR = 1

export const E2E_POOL_REWIND_DENOMINATOR = 3
