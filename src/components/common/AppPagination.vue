<template>
  <div
    v-if="total > 0"
    class="app-pagination"
  >
    <span
      class="app-pagination__range"
      data-cy="pagination-range"
    >{{ rangeText }}</span>
    <origam-pagination
      :model-value="page"
      :length="pageCount"
      :total-visible="visiblePages"
      :aria-label="label"
      @update:model-value="handlePage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamPagination } from 'origam/components'
import { useT } from '~/composables/useT'
import { PAGINATION_VISIBLE_PAGES } from '~/consts/pagination.const'
import type { IAppPaginationEmits, IAppPaginationProps } from '~/interfaces/common-components.interface'

/*********************************************************
 * Global
 *
 * @description
 * Compteur « 1–20 sur N » et pages numérotées (`origam-pagination`, F-04-PAG). Le mode `with-info` d'Origam remplace la
 * liste des pages par la seule page courante : le compteur est donc un texte de l'application, posé à côté du composant.
 * Les règles de thème et de `main.css` qui rendent la pagination comme la maquette valent pour toute pagination.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAppPaginationProps>(), {})
const emits = defineEmits<IAppPaginationEmits>()
defineSlots<{}>()
const visiblePages = PAGINATION_VISIBLE_PAGES

/*********************************************************
 * Libellés
 *
 * @description
 * Le nombre de pages vient du total et de la taille de page ; la plage affichée est celle de la page courante.
 ********************************************************/
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const label = computed(() => t('pagination.label', 'Pagination'))
const rangeText = computed(() => t('pagination.range', '{from}–{to} sur {total}', {
  from: (props.page - 1) * props.pageSize + 1,
  to: Math.min(props.page * props.pageSize, props.total),
  total: props.total
}))

/*********************************************************
 * Actions
 *
 * @description
 * Le parent possède la page courante.
 ********************************************************/
const handlePage = (value: number) => {
  emits('update:page', value)
}

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.app-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-pagination---gap, var(--origam-space---3));
  margin-top: var(--app-pagination---margin-top, var(--origam-space---5));
  font-size: var(--origam-font__size---sm);
  color: var(--origam-color__text---secondary);

  &__range {
    font-variant-numeric: tabular-nums;
  }
}
</style>

<style>
:root {
  --app-pagination---gap: var(--origam-space---3);
  --app-pagination---margin-top: var(--origam-space---5);
}
</style>
