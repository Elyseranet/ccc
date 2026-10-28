<template>
  <div class="editions-index">
    <common-page-hero
      :title="heroTitle"
    />
    <div class="page-wrap editions-index__body">
      <async-state
        :pending="isPending"
        :error="pageError"
        :empty="isEmpty"
        :empty-title="emptyTitle"
        :empty-description="emptyDescription"
        @retry="retry"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AsyncState from '~/components/common/AsyncState.vue'
import CommonPageHero from '~/components/common/PageHero.vue'
import { useEditions } from '~/composables/useEditions'
import { useT } from '~/composables/useT'
import { ROUTES } from '~/consts/routes.const'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import { fromAsyncDataError } from '~/utils/async-data-error.util'
import { currentEditionCode } from '~/utils/edition-view.util'

/*********************************************************
 * Page
 *
 * @description
 * `/editions` renvoie vers l'édition en cours (A5) : la première non close, sinon la plus récente. Tant que la liste
 * n'est pas connue, ou si elle est vide ou en erreur, la page l'explique.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
useHead({ title: computed(() => t('pages.editions.title', 'Éditions')) })

/*********************************************************
 * Redirection
 *
 * @description
 * La redirection se fait côté serveur quand la liste est disponible (SSR), sans page intermédiaire.
 ********************************************************/
const { data: editions, pending, error, refresh } = await useEditions()
const code = computed(() => currentEditionCode(editions.value ?? []))
if (code.value) {
  await navigateTo({ path: `${ROUTES.EDITIONS}/${encodeURIComponent(code.value)}` }, { replace: true })
}
const isPending = computed(() => pending.value || code.value !== null)
const pageError = computed(() => (error.value ? fromAsyncDataError(error.value) : null))
const isEmpty = computed(() => !pending.value && !error.value && code.value === null)
const retry = () => refresh()

/*********************************************************
 * Textes
 *
 * @description
 * Titre et état vide sont des clés de traduction, traduites par les composants communs.
 ********************************************************/
const heroTitle: ITranslatableText = { key: 'pages.editions.title', fallback: 'Éditions' }
const emptyTitle: ITranslatableText = { key: 'edition.index_empty_title', fallback: 'Aucune édition' }
const emptyDescription: ITranslatableText = { key: 'edition.index_empty_text', fallback: 'Aucune édition n’est encore enregistrée.' }

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
