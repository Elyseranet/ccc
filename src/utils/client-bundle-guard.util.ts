import type { Plugin } from 'vite'
import { CLIENT_BUNDLE_GUARD_PLUGIN_NAME, SERVER_ONLY_MODULE_PATTERN } from '../consts/client-bundle-guard.const.js'

/** Vrai pour un module qui n'a rien à faire dans le navigateur (voir `SERVER_ONLY_MODULE_PATTERN`). */
export const isServerOnlyModule = (id: string): boolean => SERVER_ONLY_MODULE_PATTERN.test(id)

/**
 * Plugin du build client (T-ARCH-01) : fait échouer `nuxt build` si un chunk navigateur contient encore un module
 * serveur, avec la liste des modules en cause. Le tree-shaking (`moduleSideEffects`) les retire normalement ; ce
 * plugin attrape le cas où du code navigateur appelle réellement une fonction serveur d'un service fusionné.
 */
export const clientBundleGuard = (): Plugin => ({
  name: CLIENT_BUNDLE_GUARD_PLUGIN_NAME,
  apply: 'build',
  generateBundle (_options, bundle) {
    const offenders = Object.values(bundle).flatMap((output) =>
      output.type === 'chunk' ? output.moduleIds.filter(isServerOnlyModule).map((id) => `${output.fileName} <- ${id}`) : [])
    if (offenders.length > 0) {
      this.error(`Code serveur dans le bundle navigateur :\n${offenders.join('\n')}`)
    }
  }
})
