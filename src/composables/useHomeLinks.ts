import { computed } from 'vue'
import { ROUTES } from '~/consts/routes.const'
import { isPageAccessible } from '~/utils/page-delivery.util'

/*********************************************************
 * useHomeLinks
 *
 * @description
 * Liens de l'accueil vers une page qui n'est pas livrée (T-REL-02, decisions.md ab1a6b4) : ils disparaissent tant que la
 * cible n'est pas livrée, par la même règle que la navigation (`isPageAccessible`), et reviennent d'eux-mêmes à la livraison.
 * En développement et en test toutes les pages sont accessibles : les liens restent visibles, seule la production les masque.
 * `allowUndelivered` ne sert qu'aux tests.
 ********************************************************/
export const useHomeLinks = (allowUndelivered?: boolean) => {
  const hallOfFameLinked = computed(() => isPageAccessible(ROUTES.HALL_OF_FAME, allowUndelivered))
  const hallOfFameTo = computed(() => (hallOfFameLinked.value ? ROUTES.HALL_OF_FAME : undefined))
  return { hallOfFameLinked, hallOfFameTo }
}
