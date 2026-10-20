/**
 * Délai de démarrage du serveur de test (build Nuxt compris). `@nuxt/test-utils` applique son
 * propre `setupTimeout` (120 s par défaut hors Windows) au hook de démarrage, sans lire le
 * `hookTimeout` de Vitest : un build à froid plus long échouait. Chaque `setup()` le reçoit.
 */
export const API_TEST_SETUP_TIMEOUT_MS = 300000
