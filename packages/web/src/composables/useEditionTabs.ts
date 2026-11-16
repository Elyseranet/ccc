import { computed } from 'vue'
import { EDITION_DEFAULT_TAB, EDITION_TAB_QUERY } from '~/consts/edition-view.const'
import type { EDITION_TAB } from '~/enums/edition-tab.enum'
import { resolveEditionTab } from '~/utils/edition-view.util'

/*********************************************************
 * useEditionTabs
 *
 * @description
 * Onglet actif de l'édition, porté par `?onglet=` : l'URL restaure l'état au rechargement, et changer d'édition
 * garde l'onglet (le sélecteur ne touche pas à la requête). Les onglets ne sont pas des liens : l'URL est
 * mise à jour à la main, sans empiler l'historique.
 ********************************************************/
export const useEditionTabs = () => {
  const route = useRoute()
  const router = useRouter()
  const activeTab = computed<EDITION_TAB>({
    get: () => resolveEditionTab(route.query[EDITION_TAB_QUERY], EDITION_DEFAULT_TAB),
    set: (value) => {
      router.replace({ query: { ...route.query, [EDITION_TAB_QUERY]: value }, hash: route.hash })
    }
  })
  return { activeTab }
}
