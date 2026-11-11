<template>
  <app-data-table
    class="editions-table"
    hide-default-footer
    hover
    :caption="caption"
    :headers="headers"
    :items="editions"
    :items-per-page="pageSize"
    :sort-by="sortBy"
    data-cy="editions-table"
    @update:sort-by="handleSortBy"
  >
    <template #[`item.code`]="{ item }">
      <b class="editions-table__num">{{ item.code }}</b>
    </template>
    <template #[`item.year`]="{ item }">
      <span class="editions-table__num">{{ item.year }}</span>
    </template>
    <template #[`item.name`]="{ item }">
      <span :class="{ 'editions-table__missing': !item.name }">{{ item.name ?? missingText }}</span>
    </template>
    <template #[`item.heldOn`]="{ item }">
      <span :class="{ 'editions-table__missing': !item.heldOn }">{{ dateOf(item) }}</span>
    </template>
    <template #[`item.status`]="{ item }">
      <edition-chip
        v-bind="statusOf(item)"
        :data-cy="`editions-status-${item.code}`"
      />
    </template>
    <template #[`item.origin`]="{ item }">
      <origam-chip
        v-bind="originOf(item).props"
        size="small"
        pill
        :text="originOf(item).text"
      />
    </template>
    <template #[`item.participantCount`]="{ item }">
      <span class="editions-table__num">{{ item.participantCount ?? noValue }}</span>
    </template>
    <template #[`item.actions`]="{ item }">
      <origam-btn
        class="editions-table__action"
        variant="text"
        color="primary"
        size="small"
        :to="linkOf(item)"
        :text="actionOf(item)"
        :aria-label="actionLabelOf(item)"
        :data-cy="`editions-action-${item.code}`"
      />
    </template>
  </app-data-table>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { OrigamBtn, OrigamChip } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import { ADMIN_EDITION_COLUMNS, ADMIN_EDITIONS_DEFAULT_SORT, EDITION_ORIGIN_CHIPS } from '~/consts/admin-editions.const'
import { EDITION_HERO_STATUS } from '~/consts/edition-view.const'
import type { IEditionsTableProps } from '~/interfaces/admin-editions.interface'
import type { IEditionSummary } from '~/interfaces/edition.interface'
import { buildAdminEditionLink, formatEditionDate, isEditionClosed } from '~/utils/admin-editions.util'

/*********************************************************
 * Global
 *
 * @description
 * Liste des éditions (code, année, nom, date, statut, origine, participants, action). Une édition de l'archive n'a ni nom ni date :
 * « Non renseigné ». Le N n'est connu qu'à la clôture : « — » avant. L'action est « Consulter » pour une édition
 * clôturée (lecture seule), « Modifier » sinon. La table n'est pas paginée : toutes les éditions tiennent sur une page.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionsTableProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const missingText = computed(() => t('admin.editions.not_provided', 'Non renseigné'))
const noValue = computed(() => t('admin.editions.no_value', '—'))
const caption = computed(() => t('admin.editions.table_caption', 'Éditions du championnat'))
const pageSize = computed(() => Math.max(1, props.editions.length))

/*********************************************************
 * En-têtes et tri
 *
 * @description
 * Le tri se fait dans la table, sur les valeurs affichées ; seuls le code et l'année sont triables.
 ********************************************************/
const headers = computed(() => ADMIN_EDITION_COLUMNS.map(column => ({
  key: column.field,
  title: t(column.title.key, column.title.fallback),
  ...(column.align ? { align: column.align } : {}),
  sortable: column.sortable,
  width: column.width,
  minWidth: column.minWidth,
  nowrap: true
})))
const sortBy = ref<Array<{ key: string, order?: boolean | 'asc' | 'desc' }>>([...ADMIN_EDITIONS_DEFAULT_SORT])
const handleSortBy = (value: Array<{ key: string, order?: boolean | 'asc' | 'desc' }>) => {
  sortBy.value = value
}

/*********************************************************
 * Cellules
 *
 * @description
 * Les pastilles suivent la recette des chips (mapping.md) ; chaque action nomme l'édition pour les lecteurs d'écran.
 ********************************************************/
const dateOf = (edition: IEditionSummary): string => formatEditionDate(edition.heldOn) ?? missingText.value
const statusOf = (edition: IEditionSummary) => {
  const status = EDITION_HERO_STATUS[edition.status]
  return { text: t(status.label.key, status.label.fallback), family: status.family }
}
const originOf = (edition: IEditionSummary) => {
  const origin = EDITION_ORIGIN_CHIPS[edition.origin]
  return { text: t(origin.label.key, origin.label.fallback), props: origin.props }
}
const linkOf = (edition: IEditionSummary): string => buildAdminEditionLink(edition.code)
const actionOf = (edition: IEditionSummary): string => isEditionClosed(edition)
  ? t('admin.editions.action_view', 'Consulter')
  : t('admin.editions.action_edit', 'Modifier')
const actionLabelOf = (edition: IEditionSummary): string => isEditionClosed(edition)
  ? t('admin.editions.action_view_label', 'Consulter l’édition {code}', { code: edition.code })
  : t('admin.editions.action_edit_label', 'Modifier l’édition {code}', { code: edition.code })

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.editions-table {
  &__num {
    font-variant-numeric: tabular-nums;
  }

  &__action {
    --origam-btn---height: var(--origam-space---11);
    --origam-btn---padding-sm: var(--origam-space---4);
    --origam-btn---font-size: var(--origam-font__size---sm);
  }

  &__missing {
    color: var(--editions-table__missing---color, var(--origam-color__text---tertiary));
  }
}
</style>

<style>
:root {
  --editions-table__missing---color: var(--origam-color__text---tertiary);
}
</style>
