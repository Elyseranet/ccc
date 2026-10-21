<template>
  <div class="rules-page">
    <common-page-hero
      :title="heroTitle"
      :subtitle="heroSubtitle"
    >
      <template #eyebrow>
        <p
          class="rules-page__eyebrow"
          data-cy="rules-eyebrow"
        >
          {{ eyebrow }}
        </p>
      </template>
    </common-page-hero>
    <section
      class="rules-page__body page-wrap"
      :aria-label="bodyLabel"
    >
      <origam-tabs
        v-model="activeTab"
        variant="pills"
        rounded="full"
        color="primary"
        class="rules-page__tabs"
        :aria-label="tabsLabel"
        data-cy="rules-tabs"
      >
        <origam-tab
          v-for="tab in tabs"
          :key="tab.value"
          :value="tab.value"
          :text="tab.text"
          :data-cy="tab.dataCy"
        />
      </origam-tabs>
      <origam-tab-panels
        v-model="activeTab"
        :transition="false"
      >
        <origam-tab-panel :value="gameTab">
          <rules-game />
        </origam-tab-panel>
        <origam-tab-panel :value="tournamentTab">
          <rules-tournament />
        </origam-tab-panel>
        <origam-tab-panel :value="variantsTab">
          <rules-variants />
        </origam-tab-panel>
      </origam-tab-panels>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamTab, OrigamTabPanel, OrigamTabPanels, OrigamTabs } from 'origam/components'
import { useT } from '~/composables/useT'
import { useRulesTab } from '~/composables/useRulesTab'
import { RULES_TAB } from '~/enums/rules-tab.enum'

/*********************************************************
 * Page
 *
 * @description
 * Règles du jeu, du tournoi et variantes : contenu statique traduit, sans endpoint.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
useHead({ title: computed(() => t('pages.rules.title', 'Règles')) })

/*********************************************************
 * Textes
 *
 * @description
 * Le titre et le chapeau sont passés à PageHero sous forme de clés, c'est lui qui traduit.
 ********************************************************/
const heroTitle = { key: 'rules.page_title', fallback: 'Les règles du Caps' }
const heroSubtitle = { key: 'rules.page_lead', fallback: 'Un jeu d’adresse : faire tomber la capsule posée sur la bière adverse. Le déroulé d’un point, les huit règles d’or, le fonctionnement du tournoi et les variantes.' }
const eyebrow = computed(() => t('rules.page_eyebrow', 'Règlement officiel'))
const bodyLabel = computed(() => t('rules.body_label', 'Contenu du règlement'))
const tabsLabel = computed(() => t('rules.tabs_label', 'Sections'))

/*********************************************************
 * Onglets
 *
 * @description
 * L'onglet actif suit le hash de l'URL (`#variantes`).
 ********************************************************/
const gameTab = RULES_TAB.GAME
const tournamentTab = RULES_TAB.TOURNAMENT
const variantsTab = RULES_TAB.VARIANTS
const { activeTab } = useRulesTab()
const tabs = computed(() => [
  { value: RULES_TAB.GAME, text: t('rules.tab_game', 'Le jeu'), dataCy: 'rules-tab-game' },
  { value: RULES_TAB.TOURNAMENT, text: t('rules.tab_tournament', 'Le tournoi'), dataCy: 'rules-tab-tournament' },
  { value: RULES_TAB.VARIANTS, text: t('rules.tab_variants', 'Variantes'), dataCy: 'rules-tab-variants' }
])

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.rules-page {
  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__tabs {
    width: max-content;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  &__body {
    display: grid;
    gap: var(--rules-page---gap, var(--origam-space---6));
    padding-bottom: var(--rules-page---padding-bottom, var(--origam-space---16));
  }
}
</style>

<style>
:root {
  --rules-page---gap: var(--origam-space---6);
  --rules-page---padding-bottom: var(--origam-space---16);
}
</style>
