<template>
  <div class="edition-page">
    <common-page-hero
      :title="heroTitle"
      :breadcrumb="breadcrumb"
    >
      <template #after-lead>
        <div class="edition-page__row">
          <div
            v-if="metaView"
            class="edition-page__meta"
            data-cy="edition-meta"
          >
            <edition-chip
              :family="metaView.family"
              :text="metaView.status"
            />
            <span class="edition-page__summary">{{ metaView.summary }}</span>
          </div>
          <edition-selector
            v-if="hasOptions"
            :options="options"
            :current="code"
            class="edition-page__selector"
            @select="handleSelectEdition"
          />
        </div>
      </template>
    </common-page-hero>
    <section
      class="edition-page__body page-wrap"
      :aria-label="bodyLabel"
    >
      <async-state
        :pending="pending"
        :error="pageError"
        @retry="refresh"
      >
        <template #default>
          <origam-tabs
            v-model="activeTab"
            variant="pills"
            rounded="full"
            :aria-label="tabsLabel"
            class="edition-page__tabs"
            data-cy="edition-tabs"
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
            <origam-tab-panel :value="summaryTab">
              <edition-summary
                :podium="podium"
                :facts="facts"
                :steps="steps"
              />
            </origam-tab-panel>
            <origam-tab-panel :value="participantsTab">
              <edition-participants :participants="participants" />
            </origam-tab-panel>
            <origam-tab-panel :value="drawsTab">
              <edition-draws
                :seeds="seeds"
                :pools-status="poolsStatus"
                :round-draws="roundDraws"
              />
            </origam-tab-panel>
            <origam-tab-panel
              v-for="upcoming in upcomingPanels"
              :key="upcoming.value"
              :value="upcoming.value"
            >
              <edition-upcoming
                :heading="upcoming.heading"
                :data-cy="upcoming.dataCy"
              />
            </origam-tab-panel>
          </origam-tab-panels>
        </template>
      </async-state>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamTab, OrigamTabPanel, OrigamTabPanels, OrigamTabs } from 'origam/components'
import AsyncState from '~/components/common/AsyncState.vue'
import CommonPageHero from '~/components/common/PageHero.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import EditionDraws from '~/components/edition/EditionDraws.vue'
import EditionParticipants from '~/components/edition/EditionParticipants.vue'
import EditionSelector from '~/components/edition/EditionSelector.vue'
import EditionSummary from '~/components/edition/EditionSummary.vue'
import EditionUpcoming from '~/components/edition/EditionUpcoming.vue'
import { useEditionTabs } from '~/composables/useEditionTabs'
import { useEditionView } from '~/composables/useEditionView'
import { useT } from '~/composables/useT'
import { EDITION_TABS, EDITION_UPCOMING_TABS } from '~/consts/edition-view.const'
import { ROUTES } from '~/consts/routes.const'
import { EDITION_TAB } from '~/enums/edition-tab.enum'
import type { IBreadcrumbEntry, ITranslatableText } from '~/interfaces/common-components.interface'

/*********************************************************
 * Page
 *
 * @description
 * Édition : en-tête (statut, chiffres, sélecteur), puis six onglets. L'URL porte le `code` de l'édition (R-9) et
 * `?onglet=` ; changer d'édition garde l'onglet. Synthèse, Participants et Tirages sont rendus par F-03a ; Poules,
 * Bracket et Matchs montrent un état « à venir » en attendant F-03b.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const route = useRoute()
const code = computed(() => String(route.params.id))
useHead({ title: computed(() => t('edition.page_title', 'Édition {code}', { code: code.value })) })

/*********************************************************
 * Données
 *
 * @description
 * La page ne fait que brancher `useEditionView` (mise en forme testée en unitaire) sur les composants.
 ********************************************************/
const { pending, pageError, refresh, heroMeta: meta, podium, facts, steps, participants, seeds, poolsDraw, roundDraws, options } = await useEditionView(code)
const { activeTab } = useEditionTabs()
const poolsStatus = computed(() => poolsDraw.value?.status ?? null)
const hasOptions = computed(() => options.value.length > 0)
const metaView = computed(() => meta.value
  ? { family: meta.value.family, status: t(meta.value.status.key, meta.value.status.fallback), summary: t(meta.value.summary.key, meta.value.summary.fallback, meta.value.summary.params) }
  : null)

/*********************************************************
 * Changement d'édition
 *
 * @description
 * Le code change, la requête (dont `?onglet=`) reste : l'onglet est conservé.
 ********************************************************/
const handleSelectEdition = (next: string) => {
  navigateTo({ path: `${ROUTES.EDITIONS}/${encodeURIComponent(next)}`, query: route.query })
}

/*********************************************************
 * Textes
 *
 * @description
 * Titre et fil d'Ariane sont des clés de traduction (traduites par PageHero) ; les onglets sont traduits ici.
 ********************************************************/
const heroTitle = computed<ITranslatableText>(() => ({ key: 'edition.hero_title', fallback: 'Édition {code}', params: { code: code.value } }))
const breadcrumb = computed<IBreadcrumbEntry[]>(() => [
  { text: { key: 'edition.breadcrumb_home', fallback: 'Accueil' }, to: ROUTES.HOME },
  { text: { key: 'edition.breadcrumb_editions', fallback: 'Éditions' }, to: ROUTES.EDITIONS },
  { text: { key: 'edition.breadcrumb_current', fallback: '{code}', params: { code: code.value } } }
])
const bodyLabel = computed(() => t('edition.body_label', 'Contenu de l’édition'))
const tabsLabel = computed(() => t('edition.tabs_label', 'Sections'))
const tabs = computed(() => EDITION_TABS.map(tab => ({ value: tab.value, text: t(tab.label.key, tab.label.fallback), dataCy: tab.dataCy })))
const summaryTab = EDITION_TAB.SUMMARY
const participantsTab = EDITION_TAB.PARTICIPANTS
const drawsTab = EDITION_TAB.DRAWS
const upcomingPanels = computed(() => EDITION_TABS
  .filter(tab => EDITION_UPCOMING_TABS.includes(tab.value))
  .map(tab => ({ value: tab.value, dataCy: `${tab.dataCy}-upcoming`, heading: tab.label })))

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.edition-page {
  --page-hero__breadcrumb---padding-top: var(--origam-space---12);
  --page-hero---padding-block: 0 var(--origam-space---10);

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--edition-page---gap, var(--origam-space---5));
    margin-top: var(--origam-space---5);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--origam-space---3);
    margin: 0;
  }

  &__summary {
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__text---secondary);
  }

  &__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--edition-page---body-gap, var(--origam-space---6));
    padding-bottom: var(--edition-page---padding-bottom, var(--origam-space---16));
  }

  &__tabs {
    position: sticky;
    top: calc(var(--origam-space---20) + var(--origam-space---2));
    z-index: 10;
    width: max-content;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    box-shadow: var(--origam-shadow---md);
  }
}

@media (min-width: 1200px) {
  .edition-page__row {
    position: relative;
  }

  .edition-page__selector {
    position: absolute;
    right: 0;
    bottom: 0;
  }
}

@media (max-width: 760px) {
  .edition-page__tabs {
    position: static;
  }
}
</style>

<style>
:root {
  --edition-page---gap: var(--origam-space---5);
  --edition-page---body-gap: var(--origam-space---6);
  --edition-page---padding-bottom: var(--origam-space---16);
}
</style>
