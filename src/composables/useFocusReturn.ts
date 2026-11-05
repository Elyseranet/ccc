import { nextTick, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

/*********************************************************
 * useFocusReturn
 *
 * @description
 * Rend le focus au déclencheur quand un dialogue se ferme (Échap, Annuler, succès). `origam-dialog` piège le focus et ferme sur
 * Échap, mais mesuré en navigateur il laisse le focus sur `<body>` à la fermeture. Le déclencheur est l'élément focalisé au
 * moment de l'ouverture ; si la fermeture l'a retiré de la page (la carte a changé de statut), il n'y a rien à refocaliser.
 ********************************************************/
export const useFocusReturn = (open: MaybeRefOrGetter<boolean>) => {
  let trigger: HTMLElement | null = null
  watch(() => toValue(open), async (isOpen) => {
    if (isOpen) {
      trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
      return
    }
    await nextTick()
    if (trigger?.isConnected) {
      trigger.focus()
    }
    trigger = null
  }, { flush: 'sync' })
}
