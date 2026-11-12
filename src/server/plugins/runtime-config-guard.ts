import { isProductionImage } from '../../utils/production-image.util'
import { assertStrictRuntimeConfig } from '../../utils/runtime-config-guard.util'

/**
 * PROD-1 : avec NUXT_STRICT_RUNTIME_CONFIG, une configuration d'invitation locale ou incomplète empêche le démarrage.
 * T-SEC-06 : dans l'image de production (marqueur du Dockerfile), le mode strict ne peut pas être éteint.
 */
export default defineNitroPlugin(() => {
  assertStrictRuntimeConfig({ ...useRuntimeConfig(), productionImage: isProductionImage() })
})
