import { resolve } from 'node:path'

/** Jetons des sessions de test écrits par `prepare-database.ts` (dossier gitignoré). */
export const E2E_SESSIONS_FILE = resolve('test-results', 'e2e-sessions.json')

export const E2E_TEST_DATABASE_SUFFIX = '_test'

/** Nom du cookie de session hors production (`SESSION_COOKIE_NAME`) : les e2e tournent sur `nuxt dev`. */
export const E2E_SESSION_COOKIE = 'ccc_session'

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`
