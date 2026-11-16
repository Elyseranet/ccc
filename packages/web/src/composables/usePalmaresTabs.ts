import { computed } from 'vue'
import { PALMARES_DEFAULT_TAB, PALMARES_TAB_QUERY } from '~/consts/palmares.const'
import type { PALMARES_TAB } from '~/enums/palmares.enum'
import { resolvePalmaresTab } from '~/utils/palmares.util'

/*********************************************************
 * usePalmaresTabs
 *
 * @description
 * Onglet actif du palmarès, porté par `?onglet=` : l'URL est partageable et restaurée au rechargement. Les onglets ne
 * sont pas des liens : l'URL est mise à jour à la main, sans empiler l'historique.
 ********************************************************/
export const usePalmaresTabs = () => {
  const route = useRoute()
  const router = useRouter()
  const activeTab = computed<PALMARES_TAB>({
    get: () => resolvePalmaresTab(route.query[PALMARES_TAB_QUERY], PALMARES_DEFAULT_TAB),
    set: (value) => {
      router.replace({ query: { ...route.query, [PALMARES_TAB_QUERY]: value }, hash: route.hash })
    }
  })
  return { activeTab }
}
