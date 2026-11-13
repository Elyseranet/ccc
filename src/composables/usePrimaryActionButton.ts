import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { PRIMARY_ACTION_BUTTON } from '~/consts/primary-action.const'

/**
 * Props `bg-color` et `elevation` d'un bouton d'action principal : posées seulement quand il est actif. Posées en ligne sur un bouton désactivé, elles l'emportent sur la règle
 * centrale de `main.css` (fond `bgDisabled`, sans ombre) et le bouton garde l'air actif : voir `docs/tickets/origam/btn-etat-desactive-tokens-bgdisabled-non-lus.md` (F-37, F-38).
 * `color` et `elevation` valent ceux d'une action principale ; un bouton à couleur variable (confirmation d'un dialogue) fournit les siens.
 */
export const usePrimaryActionButton = (
  isBlocked: Ref<boolean>,
  options: { color?: MaybeRefOrGetter<string | undefined>, elevation?: MaybeRefOrGetter<string | undefined> } = {}
) => ({
  buttonColor: computed(() => isBlocked.value ? undefined : toValue(options.color ?? PRIMARY_ACTION_BUTTON.color)),
  buttonElevation: computed(() => isBlocked.value ? undefined : toValue(options.elevation ?? PRIMARY_ACTION_BUTTON.elevation))
})
