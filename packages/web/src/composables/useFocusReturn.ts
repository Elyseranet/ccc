import { nextTick, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

/*********************************************************
 * useFocusReturn
 *
 * @description
 * Rend le focus au déclencheur quand un dialogue se ferme (Échap, Annuler, succès). `origam-dialog` piège le focus et ferme sur
 * Échap, mais mesuré en navigateur il laisse le focus sur `<body>` à la fermeture. Le déclencheur est l'élément focalisé au
 * moment de l'ouverture ; si la fermeture l'a retiré de la page (la carte a changé de statut), `fallback` (optionnel) donne l'élément qui le remplace ; sans lui, il n'y a rien à refocaliser.
 ********************************************************/
export const useFocusReturn = (open: MaybeRefOrGetter<boolean>, fallback?: () => HTMLElement | null) => {
  let trigger: HTMLElement | null = null
  watch(() => toValue(open), async (isOpen) => {
    if (isOpen) {
      trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
      return
    }
    // Deux ticks : le premier laisse `origam-dialog` retirer son piège de focus (`retainFocus`, watcher « pre »), sinon il ramène aussitôt le focus dans le dialogue.
    await nextTick()
    await nextTick()
    // Déclencheur disparu (la ligne a changé d'état) : `fallback` désigne l'élément qui le remplace (WCAG 2.4.3).
    const target = trigger?.isConnected ? trigger : fallback?.() ?? null
    target?.focus()
    trigger = null
  }, { flush: 'sync' })
}
