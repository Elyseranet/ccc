import { nextTick, onMounted, ref, watch } from 'vue'
import { RULES_DEFAULT_TAB } from '~/consts/rules.const'
import { RULES_TAB } from '~/enums/rules-tab.enum'
import { resolveRulesTab } from '~/utils/rules-tab.util'

/*********************************************************
 * Onglet actif de /regles
 *
 * @description
 * Le hash n'existe pas côté serveur : l'onglet par défaut est rendu au SSR, puis le hash est appliqué au montage
 * (sinon le rendu hydraté diverge). Un hash qui désigne un onglet l'ouvre, puis amène le focus et le défilement sur
 * la section portant cet id (`/variants` redirige vers `/regles#variantes`).
 ********************************************************/
export const useRulesTab = () => {
  const route = useRoute()
  const activeTab = ref<RULES_TAB>(RULES_DEFAULT_TAB)

  const focusAnchor = async (id: string) => {
    await nextTick()
    const target = document.getElementById(id)
    target?.focus()
    target?.scrollIntoView()
  }

  const applyHash = async (hash: string) => {
    const tab = resolveRulesTab(hash)
    const id = hash.replace(/^#/, '')
    activeTab.value = tab
    if (id === tab && hash !== '') {
      await focusAnchor(id)
    }
  }

  onMounted(() => applyHash(route.hash))
  watch(() => route.hash, hash => applyHash(hash))

  return { activeTab }
}
