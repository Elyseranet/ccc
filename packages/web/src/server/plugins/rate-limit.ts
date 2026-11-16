import { assertTrustProxyHops } from '../../utils/client-ip.util'
import { assertRateLimitConfig } from '../../utils/rate-limit.util'

/** Valide les réglages du limiteur et de la confiance proxy au démarrage : un réglage invalide empêche de démarrer. */
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  assertRateLimitConfig(config.rateLimit)
  assertTrustProxyHops(config.trustProxyHops)
})
