<template>
  <div
    class="home"
    data-cy="home-page"
  >
    <home-hero
      :archive="archive"
      :target="target"
    />
    <golden-rules />
    <div class="page-wrap">
      <async-state
        :pending="pending"
        :error="apiError"
        :empty="isEmpty"
        :empty-title="emptyTitle"
        :empty-description="emptyDescription"
        @retry="handleRetry"
      >
        <template #default>
          <home-bento
            v-if="overview"
            :overview="overview"
          />
        </template>
      </async-state>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AsyncState from '~/components/common/AsyncState.vue'
import GoldenRules from '~/components/common/GoldenRules.vue'
import HomeBento from '~/components/home/HomeBento.vue'
import HomeHero from '~/components/home/HomeHero.vue'
import { useHomeOverview } from '~/composables/useHomeOverview'
import { useT } from '~/composables/useT'
import { HOME_EMPTY_ARCHIVE } from '~/consts/home.const'

/*********************************************************
 * Page
 *
 * @description
 * Accueil : hero, bandeau des règles d'or (statique), puis le bento de l'édition en cours.
 * Le hero et le bandeau sont statiques : seuls le bento et les chiffres du hero dépendent de l'API.
 * États dégradés : chargement, erreur (dont 429 et hors ligne) et « aucune édition publiée » passent par AsyncState.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
useHead({ title: computed(() => t('pages.home.title', 'Championnat de Caps')) })

/*********************************************************
 * Données
 *
 * @description
 * Sans données (chargement, erreur), le hero reste affiché avec des compteurs à zéro : la pastille du nombre d'éditions est alors masquée.
 ********************************************************/
const { data: overview, pending, apiError, refresh } = await useHomeOverview()
const archive = computed(() => overview.value?.archive ?? HOME_EMPTY_ARCHIVE)
const target = computed(() => overview.value?.target ?? null)
const isEmpty = computed(() => overview.value !== null && overview.value !== undefined && !overview.value.hasEditions)
const emptyTitle = computed(() => ({ key: 'home.empty.title', fallback: 'Aucune édition publiée' }))
const emptyDescription = computed(() => ({ key: 'home.empty.description', fallback: 'Les éditions apparaîtront ici dès leur publication.' }))
const handleRetry = () => {
  refresh()
}

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
