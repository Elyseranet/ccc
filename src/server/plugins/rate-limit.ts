import { assertRateLimitConfig } from '../utils/http/rate-limit.util'

/** Valide les réglages du limiteur au démarrage : un réglage invalide empêche de démarrer. */
export default defineNitroPlugin(() => {
  assertRateLimitConfig(useRuntimeConfig().rateLimit)
})
