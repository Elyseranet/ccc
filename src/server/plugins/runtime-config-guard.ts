import { assertStrictRuntimeConfig } from '../../utils/runtime-config-guard.util'

/** PROD-1 : avec NUXT_STRICT_RUNTIME_CONFIG, une configuration d'invitation locale ou incomplète empêche le démarrage. */
export default defineNitroPlugin(() => {
  assertStrictRuntimeConfig(useRuntimeConfig())
})
