import { computed } from 'vue'
import type { Ref } from 'vue'
import { PRIMARY_ACTION_BUTTON } from '~/consts/primary-action.const'

/**
 * Props `bg-color` et `elevation` d'un bouton d'action principal : posées seulement quand il est actif. Posées en ligne sur un bouton désactivé, elles l'emportent sur la règle
 * centrale de `main.css` (fond `bgDisabled`, sans ombre) et le bouton garde l'air actif : voir `docs/tickets/origam/btn-etat-desactive-tokens-bgdisabled-non-lus.md` (F-37).
 */
export const usePrimaryActionButton = (isBlocked: Ref<boolean>) => ({
  buttonColor: computed(() => isBlocked.value ? undefined : PRIMARY_ACTION_BUTTON.color),
  buttonElevation: computed(() => isBlocked.value ? undefined : PRIMARY_ACTION_BUTTON.elevation)
})
