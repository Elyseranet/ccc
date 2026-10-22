import { resolveDeviceCookieSecret } from '../utils/auth/device-cookie.util'

/** En production, un secret de cookie d'appareil absent ou trop court empêche le démarrage. */
export default defineNitroPlugin(() => {
  resolveDeviceCookieSecret(String(useRuntimeConfig().auth.deviceCookieSecret))
})
