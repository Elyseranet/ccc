import { resolveDeviceCookieSecret } from '../../utils/device-cookie.util'
import { configurePasswordHashConcurrency } from '../../utils/password.util'

/**
 * Au démarrage : un secret de cookie d'appareil absent ou trop court en production, ou une limite de
 * concurrence scrypt invalide, empêchent le démarrage.
 */
export default defineNitroPlugin(() => {
  const { auth } = useRuntimeConfig()
  resolveDeviceCookieSecret(String(auth.deviceCookieSecret))
  configurePasswordHashConcurrency(auth.passwordHashConcurrency)
})
