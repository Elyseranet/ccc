<template>
  <origam-alert
    :status="status"
    rounded="lg"
    :title="title"
    :text="text"
    font-size="md"
    font-weight="bold"
    letter-spacing="normal"
    line-height="normal"
    role="status"
    :data-cy="`closing-state-${kind}`"
  >
    <template
      v-if="link"
      #default
    >
      <origam-btn
        variant="text"
        size="small"
        :to="link.to"
        :text="link.label"
        :data-cy="`closing-state-${kind}-link`"
      />
    </template>
  </origam-alert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamAlert, OrigamBtn } from 'origam/components'
import { useT } from '~/composables/useT'
import { ADMIN_MATCH_ROUND_QUERY_PARAM } from '~/consts/admin-match-filters.const'
import { CLOSING_STATE_STATUS } from '~/consts/edition-closing-view.const'
import { ROUTES } from '~/consts/routes.const'
import { CLOSING_NOTICE } from '~/enums/edition-closing-view.enum'
import { ROUND_KIND } from '~/enums/round.enum'
import type { IClosingStateProps } from '~/interfaces/edition-closing-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Les trois messages d'état de la page, en `origam-alert` (maquette « États ») : finale non validée (lien vers les scores filtrés sur la finale,
 * `?tour=FINAL`, décision du chef de projet), édition clôturée (lien vers le palmarès) et clôture réussie. Le titre porte les quatre props de typographie
 * (même recette que les autres alertes, en attendant F-17).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IClosingStateProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const status = computed(() => CLOSING_STATE_STATUS[props.kind])
const title = computed(() => {
  switch (props.kind) {
    case CLOSING_NOTICE.BLOCKED:
      return t('admin.closing.state_blocked_title', 'Finale non validée')
    case CLOSING_NOTICE.CLOSED:
      return t('admin.closing.state_closed_title', 'Édition clôturée')
    default:
      return t('admin.closing.state_success_title', 'Édition {year} clôturée.', { year: props.year })
  }
})
const text = computed(() => {
  switch (props.kind) {
    case CLOSING_NOTICE.BLOCKED:
      return t('admin.closing.state_blocked_text', 'La clôture n’est possible qu’après validation de la finale.')
    case CLOSING_NOTICE.CLOSED:
      return t('admin.closing.state_closed_text', 'Points figés.')
    default:
      return t('admin.closing.state_success_text', 'Les classements ont été mis à jour.')
  }
})
const link = computed(() => {
  switch (props.kind) {
    case CLOSING_NOTICE.BLOCKED:
      return { to: `${ROUTES.ADMIN_MATCHES}?${ADMIN_MATCH_ROUND_QUERY_PARAM}=${ROUND_KIND.FINAL}`, label: t('admin.closing.state_blocked_link', 'Aller aux scores') }
    case CLOSING_NOTICE.CLOSED:
      return { to: ROUTES.HALL_OF_FAME, label: t('admin.closing.state_closed_link', 'Voir le palmarès') }
    default:
      return null
  }
})

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>
