<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    class="closing-effects"
    data-cy="closing-effects"
  >
    <template #default>
      <header class="closing-effects__head">
        <h2
          :id="titleId"
          class="closing-effects__title"
        >
          {{ title }}
        </h2>
      </header>
      <ul class="closing-effects__list">
        <li
          v-for="effect in effects"
          :key="effect.id"
        >
          <abbr-text :text="effect.text" />
        </li>
      </ul>
      <div
        v-if="hasRows"
        class="closing-effects__preview"
        data-cy="closing-preview"
      >
        <app-data-table
          :headers="headers"
          :items="rowViews"
          :caption="caption"
          caption-visible
          hide-default-footer
          class="closing-effects__table"
        />
        <p
          class="closing-effects__note"
          data-cy="closing-preview-note"
        >
          {{ note }}
        </p>
      </div>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import AbbrText from '~/components/common/AbbrText.vue'
import { computed, useId } from 'vue'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import { OrigamCard } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import { useT } from '~/composables/useT'
import { CLOSING_STAGE_TEXT } from '~/consts/edition-closing-view.const'
import { POINTS_REFERENCE_PARTICIPANTS } from '~/consts/domain-rules.const'
import { CLOSING_PREVIEW_COLUMN } from '~/enums/edition-closing-view.enum'
import type { IClosingEffectsProps } from '~/interfaces/edition-closing-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * « Ce que la clôture fait » : les conséquences en liste (points figés RG1 et RG2, lecture seule partout, classements ACP et All Time mis à jour, barème non
 * rétroactif), puis l'aperçu des points : un résultat par ligne, sa base du barème et les points que la clôture figera (« base × N / 50 = points »).
 * Les points viennent de `computeClosingPreview`, la fonction même qui les fige côté serveur (CLOSE-PREVIEW). L'aperçu n'apparaît que si la finale est validée.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IClosingEffectsProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const titleId = useId()
const title = computed(() => t('admin.closing.effects_title', 'Ce que la clôture fait'))
const effects = computed(() => [
  { id: 'points', text: t('admin.closing.effect_points', 'Les points de chaque participation sont figés : barème × N / 50, N = nombre de participants (RG1, RG2).') },
  { id: 'readonly', text: t('admin.closing.effect_readonly', 'L’édition passe en lecture seule partout : participants, tirages, scores, qualification.') },
  { id: 'rankings', text: t('admin.closing.effect_rankings', 'Les classements ACP et All Time intègrent l’édition.') },
  { id: 'scale', text: t('admin.closing.effect_scale', 'Un changement de barème ultérieur ne réécrit pas le palmarès.') }
])
const note = computed(() => t('admin.closing.preview_note', 'Un tour non disputé rapporte « / » (RG3).'))
const caption = computed(() => t('admin.closing.preview_caption', 'Aperçu des points pour {count} participants', { count: props.participantCount }))
const hasRows = computed(() => props.rows.length > 0)
const formatPoints = (value: number): string => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const headers = computed<IDataTableHeader[]>(() => [
  { key: CLOSING_PREVIEW_COLUMN.RESULT, title: t('admin.closing.preview_col_result', 'Résultat'), sortable: false },
  { key: CLOSING_PREVIEW_COLUMN.BASE, title: t('admin.closing.preview_col_base', 'Base'), sortable: false, align: ALIGN.END },
  { key: CLOSING_PREVIEW_COLUMN.POINTS, title: t('admin.closing.preview_col_points', 'Points'), sortable: false, align: ALIGN.END }
])
const rowViews = computed(() => props.rows.map(row => ({
  [CLOSING_PREVIEW_COLUMN.RESULT]: t(CLOSING_STAGE_TEXT[row.stage].key, CLOSING_STAGE_TEXT[row.stage].fallback),
  [CLOSING_PREVIEW_COLUMN.BASE]: String(row.base),
  [CLOSING_PREVIEW_COLUMN.POINTS]: row.points === null ? t('admin.closing.preview_not_played', '/') : t('admin.closing.preview_formula', '{base} × {count} / {reference} = {points}', {
    base: row.base,
    count: props.participantCount,
    reference: POINTS_REFERENCE_PARTICIPANTS,
    points: formatPoints(row.points)
  })
})))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.closing-effects {
  padding: var(--closing-effects---padding, var(--origam-space---6));

  @media (max-width: 760px) {
    padding: var(--origam-space---5);
  }

  &__head {
    margin-bottom: var(--origam-space---4);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__list {
    display: grid;
    gap: var(--origam-space---2);
    margin: 0;
    padding-inline-start: 1.25em;
    list-style: disc;
  }

  &__preview {
    display: grid;
    gap: var(--origam-space---2);
    margin-top: var(--origam-space---3);
  }

  &__note {
    margin: 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }

  &__table :deep(th),
  &__table :deep(td) {
    white-space: normal;
  }
}
</style>

<style>
:root {
  --closing-effects---padding: var(--origam-space---6);
}
</style>
