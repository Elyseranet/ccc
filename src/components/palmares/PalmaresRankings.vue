<template>
  <section
    class="palmares-rankings"
    aria-labelledby="palmares-rankings-title"
    data-cy="palmares-rankings"
  >
    <div class="palmares-rankings__head">
      <origam-title
        id="palmares-rankings-title"
        tag="h2"
        margin="0"
        font-size="4xl"
        line-height="none"
        class="palmares-rankings__title font-display neon--sm"
        :text="title"
      />
      <p class="palmares-rankings__note">
        <abbr-text :text="note" />
      </p>
    </div>
    <origam-tabs
      v-model="activeTab"
      variant="pills"
      rounded="full"
      :aria-label="tabsLabel"
      class="palmares-rankings__tabs"
      data-cy="palmares-tabs"
    >
      <origam-tab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :text="tab.text"
        :data-cy="tab.dataCy"
      >
        <template #default>
          <abbr-text :text="tab.text" />
        </template>
      </origam-tab>
    </origam-tabs>
    <origam-tab-panels
      v-model="activeTab"
      :transition="false"
    >
      <origam-tab-panel :value="PALMARES_TAB.ACP">
        <palmares-ranking-table
          :kind="RANKING_KIND.ACP"
          :rows="acp"
          :caption="acpCaption"
          data-cy="palmares-table-acp"
        />
      </origam-tab-panel>
      <origam-tab-panel :value="PALMARES_TAB.ALL_TIME">
        <palmares-ranking-table
          :kind="RANKING_KIND.ALL_TIME"
          :rows="allTime"
          :caption="allTimeCaption"
          data-cy="palmares-table-all-time"
        />
      </origam-tab-panel>
      <origam-tab-panel :value="PALMARES_TAB.EVOLUTION">
        <palmares-evolution :evolution="evolution" />
      </origam-tab-panel>
    </origam-tab-panels>
  </section>
</template>

<script setup lang="ts">
import AbbrText from '~/components/common/AbbrText.vue'
import { computed } from 'vue'
import { OrigamTab, OrigamTabPanel, OrigamTabPanels, OrigamTabs, OrigamTitle } from 'origam/components'
import PalmaresEvolution from '~/components/palmares/PalmaresEvolution.vue'
import PalmaresRankingTable from '~/components/palmares/PalmaresRankingTable.vue'
import { usePalmaresTabs } from '~/composables/usePalmaresTabs'
import { useT } from '~/composables/useT'
import { ACP_WINDOW } from '~/consts/domain-rules.const'
import { PALMARES_TABS } from '~/consts/palmares.const'
import { PALMARES_TAB } from '~/enums/palmares.enum'
import { RANKING_KIND } from '~/enums/ranking-kind.enum'
import type { IPalmaresRankingsProps } from '~/interfaces/palmares.interface'

/*********************************************************
 * Global
 *
 * @description
 * Classements ACP et All Time (RG4) et évolution (RG8), en trois onglets. L'onglet actif est porté par `?onglet=` : l'URL
 * est partageable et les flèches parcourent les onglets (origam-tabs). Le style des onglets vient du thème, pas d'une prop locale.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPalmaresRankingsProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { activeTab } = usePalmaresTabs()
const title = computed(() => t('palmares.rankings_title', 'Classements'))
const note = computed(() => props.scope
  ? t('palmares.rankings_note', 'Barème RG1 × effectif / 50 (RG2) · au terme de l’édition {year}', { year: props.scope.lastYear })
  : t('palmares.rankings_note_no_scope', 'Barème RG1 × effectif / 50 (RG2)'))
const tabsLabel = computed(() => t('palmares.tabs_label', 'Classements du palmarès'))
const tabs = computed(() => PALMARES_TABS.map(tab => ({ value: tab.value, text: t(tab.label.key, tab.label.fallback), dataCy: tab.dataCy })))
const acpCaption = computed(() => props.scope
  ? t('palmares.caption_acp', 'Classement ACP — somme des {count} dernières éditions ({from} à {to})', { count: ACP_WINDOW, from: props.scope.windowFirstYear, to: props.scope.windowLastYear })
  : t('palmares.caption_acp_no_scope', 'Classement ACP'))
const allTimeCaption = computed(() => t('palmares.caption_all_time', 'Classement All Time — toutes les éditions'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.palmares-rankings {
  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: var(--origam-space---4);
    margin-bottom: var(--origam-space---8);
  }

  &__note {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__tabs {
    width: max-content;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    margin-bottom: var(--origam-space---4);
  }
}
</style>
