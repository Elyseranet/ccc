<template>
  <div
    class="async-state"
    data-cy="async-state"
  >
    <origam-skeleton-group
      v-if="pending"
      :label="loadingLabel"
      data-cy="async-state-loading"
    >
      <template #default>
        <origam-skeleton
          v-for="line in skeletonLines"
          :key="line"
          variant="text"
        />
      </template>
    </origam-skeleton-group>
    <origam-alert
      v-else-if="hasError"
      status="error"
      closable
      :title="errorTitle"
      :text="errorText"
      data-cy="async-state-error"
    >
      <template #close>
        <origam-btn
          variant="outlined"
          size="small"
          :text="retryLabel"
          data-cy="async-state-retry"
          @click="handleRetry"
        />
      </template>
    </origam-alert>
    <origam-empty-state
      v-else-if="empty"
      preset="no-results"
      :title="emptyTitleText"
      :description="emptyDescriptionText"
      data-cy="async-state-empty"
    />
    <slot
      v-else
      name="default"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamEmptyState, OrigamSkeleton, OrigamSkeletonGroup } from 'origam/components'
import { API_ERROR_CODE } from '~/enums/api-error-code.enum'
import { useT } from '~/composables/useT'
import { SKELETON_LINES } from '~/consts/async-state.const'
import { HTTP_STATUS_TOO_MANY_REQUESTS } from '~/consts/http-status.const'
import type { IAsyncStateEmits, IAsyncStateProps } from '~/interfaces/common-components.interface'

/*********************************************************
 * Global
 *
 * @description
 * Les trois états dégradés d'un écran : chargement (squelette), erreur (alerte avec nouvelle tentative) et vide.
 * Une erreur sans réponse (réseau coupé, timeout) est distinguée d'une réponse en erreur : « hors ligne ».
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAsyncStateProps>(), {
  pending: false,
  error: null,
  empty: false,
  emptyTitle: undefined,
  emptyDescription: undefined
})
const emits = defineEmits<IAsyncStateEmits>()
defineSlots<{ default(): unknown }>()
const skeletonLines = SKELETON_LINES

/*********************************************************
 * Chargement
 *
 * @description
 * Le groupe de squelettes porte un libellé accessible : « Chargement en cours ».
 ********************************************************/
const loadingLabel = computed(() => t('components.async_state.loading', 'Chargement en cours'))

/*********************************************************
 * Erreur
 *
 * @description
 * Hors ligne et erreur serveur ont des textes distincts ; la nouvelle tentative émet `retry`, le parent relance sa requête.
 ********************************************************/
const hasError = computed(() => props.error !== null)
const isRateLimited = computed(() => props.error?.error.statusCode === HTTP_STATUS_TOO_MANY_REQUESTS || props.error?.error.code === API_ERROR_CODE.RATE_LIMITED)
const errorTitle = computed(() => {
  if (isRateLimited.value) {
    return t('components.async_state.rate_limited', 'Trop de requêtes, réessayez dans un instant')
  }
  return props.error?.isOffline
    ? t('components.async_state.offline_title', 'Vous semblez hors ligne')
    : t('components.async_state.error_title', 'Le chargement a échoué')
})
const errorText = computed(() => {
  if (isRateLimited.value) {
    return ''
  }
  return props.error?.isOffline
    ? t('components.async_state.offline_text', 'Vérifiez votre connexion, puis réessayez.')
    : t('components.async_state.error_text', 'Une erreur est survenue. Réessayez dans un instant.')
})
const retryLabel = computed(() => t('components.async_state.retry', 'Réessayer'))
const handleRetry = () => {
  emits('retry')
}

/*********************************************************
 * Vide
 *
 * @description
 * Titre et description du vide sont fournis par l'écran (clés de traduction), avec un repli générique.
 ********************************************************/
const emptyTitleText = computed(() => props.emptyTitle
  ? t(props.emptyTitle.key, props.emptyTitle.fallback, props.emptyTitle.params)
  : t('components.async_state.empty_title', 'Aucun résultat'))
const emptyDescriptionText = computed(() => props.emptyDescription
  ? t(props.emptyDescription.key, props.emptyDescription.fallback, props.emptyDescription.params)
  : '')

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>
