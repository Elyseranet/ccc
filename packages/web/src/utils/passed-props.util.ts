import { camelize } from 'vue'
import { PASSED_LISTENER_PREFIX } from '../consts/passed-props.const.js'

/*********************************************************
 * Props réellement passées à un composant
 *
 * @description
 * Une prop booléenne absente vaut `false` dans les `props` d'un composant qui la déclare. Un wrapper qui retransmet
 * tout écraserait donc les valeurs par défaut du thème (`hover`, `border`…) par `false`. On ne retransmet que les props
 * présentes dans les props bruts du vnode (clés en kebab-case ou en camelCase), et les écouteurs tels quels.
 ********************************************************/
export const pickPassedProps = (rawProps: Record<string, unknown> | null | undefined, props: Record<string, unknown>): Record<string, unknown> => {
  const passed = new Set(Object.keys(rawProps ?? {}).map(key => camelize(key)))
  return Object.fromEntries(Object.entries(props).filter(([name]) => passed.has(name)))
}

export const pickPassedListeners = (rawProps: Record<string, unknown> | null | undefined): Record<string, unknown> =>
  Object.fromEntries(Object.entries(rawProps ?? {}).filter(([name]) => PASSED_LISTENER_PREFIX.test(name)))
