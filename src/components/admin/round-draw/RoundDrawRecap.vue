<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    class="round-draw-recap"
    data-cy="round-draw-recap"
  >
    <template #default>
      <header class="round-draw-recap__head">
        <h2
          :id="titleId"
          class="round-draw-recap__title"
        >
          {{ title }}
        </h2>
      </header>
      <div
        v-if="hasRows"
        class="round-draw-recap__scroll"
        data-cy="round-draw-recap-table"
      >
        <app-data-table
          :headers="headers"
          :items="rows"
          :caption="caption"
          hide-default-footer
          class="round-draw-recap__table"
        >
          <template #item.first="{ item }">
            <strong>{{ item.first.displayName }}</strong>
          </template>
          <template #item.second="{ item }">
            <strong>{{ item.second.displayName }}</strong>
          </template>
        </app-data-table>
      </div>
      <p
        v-else
        class="round-draw-recap__empty"
      >
        {{ emptyText }}
      </p>
      <div class="round-draw-recap__action">
        <origam-btn
          variant="flat"
          :bg-color="buttonColor"
          :elevation="buttonElevation"
          size="x-large"
          aria-haspopup="dialog"
          :disabled="isBlocked"
          :loading="busy"
          :text="buttonLabel"
          data-cy="round-draw-validate-open"
          @click="handleOpen"
        />
        <p
          v-if="blockerText"
          class="round-draw-recap__why"
          data-cy="round-draw-validate-why"
        >
          {{ blockerText }}
        </p>
      </div>
      <confirm-dialog
        :open="dialogOpen"
        :busy="busy"
        :title="dialogTitle"
        :text="dialogText"
        :cancel-label="cancelLabel"
        :confirm-label="confirmLabel"
        cy-prefix="round-draw-validate"
        confirm-color="primary"
        confirm-elevation="lg"
        :appearance="dialogAppearance"
        @cancel="handleCancel"
        @confirm="handleConfirm"
      />
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import { OrigamBtn, OrigamCard } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import { ROUND_DRAW_TARGET_SCORE, ROUND_DRAW_TEXTS } from '~/consts/round-draw.const'
import { CONFIRM_DIALOG_APPEARANCE } from '~/enums/confirm-dialog.enum'
import { ROUND_DRAW_BLOCKER, ROUND_DRAW_RECAP_COLUMN } from '~/enums/round-draw.enum'
import type { IRoundDrawRecapEmits, IRoundDrawRecapProps } from '~/interfaces/round-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * Récapitulatif des affiches tirées et validation du tirage : « Valider le tirage … » est inactif avec sa raison écrite dessous, puis une confirmation définitive (décision
 * c9790abd (3) : « il n'est pas possible de revenir en arrière »), qui crée les matchs du tour à 10 points. La validation est idempotente côté serveur. Même apparence de dialogue
 * que la qualification (F-24) : `MOCKUP`, jusqu'à la décision F-30.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IRoundDrawRecapProps>(), {})
const emits = defineEmits<IRoundDrawRecapEmits>()
defineSlots<{}>()
const titleId = useId()
const dialogOpen = ref(false)
const dialogAppearance = CONFIRM_DIALOG_APPEARANCE.MOCKUP
const of = computed(() => t(ROUND_DRAW_TEXTS[props.roundKind].of.key, ROUND_DRAW_TEXTS[props.roundKind].of.fallback))
const title = computed(() => t('admin.round_draw.recap_title', 'Récapitulatif et validation'))
const caption = computed(() => t('admin.round_draw.recap_caption', 'Affiches {round}', { round: of.value }))
const emptyText = computed(() => t('admin.round_draw.recap_empty', 'Les affiches saisies apparaissent ici.'))
const hasRows = computed(() => props.rows.length > 0)
const isBlocked = computed(() => props.blocker !== null || props.busy)
const { buttonColor, buttonElevation } = usePrimaryActionButton(isBlocked)
const buttonLabel = computed(() => t('admin.round_draw.validate_button', 'Valider le tirage {round}…', { round: of.value }))
const headers = computed<IDataTableHeader[]>(() => [
  { key: ROUND_DRAW_RECAP_COLUMN.NUMBER, title: t('admin.round_draw.recap_col_number', '#'), sortable: false, align: ALIGN.END },
  { key: ROUND_DRAW_RECAP_COLUMN.FIRST, title: t('admin.round_draw.recap_col_first', 'Joueur 1'), sortable: false },
  { key: ROUND_DRAW_RECAP_COLUMN.SECOND, title: t('admin.round_draw.recap_col_second', 'Joueur 2'), sortable: false }
])
const blockerText = computed(() => {
  switch (props.blocker) {
    case null:
      return ''
    case ROUND_DRAW_BLOCKER.SAVING:
      return t('admin.round_draw.blocker_saving', 'Indisponible : enregistrement du brouillon en cours.')
    case ROUND_DRAW_BLOCKER.SAVE_FAILED:
      return t('admin.round_draw.blocker_save_failed', 'Indisponible : le dernier enregistrement a échoué, renvoyez la saisie.')
    default:
      return props.remaining === 1
        ? t('admin.round_draw.blocker_left_one', 'Indisponible : 1 affiche reste à saisir.')
        : t('admin.round_draw.blocker_left_other', 'Indisponible : {count} affiches restent à saisir.', { count: props.remaining })
  }
})

/*********************************************************
 * Confirmation
 *
 * @description
 * Le dialogue dit la conséquence (matchs créés, cible) et que c'est définitif ; il reste ouvert pendant l'envoi et se ferme à la fin, succès ou échec.
 ********************************************************/
const dialogTitle = computed(() => t('admin.round_draw.dialog_title', 'Valider le tirage {round} ?', { round: of.value }))
const dialogText = computed(() => t('admin.round_draw.dialog_text', '{count} matchs seront créés, à {target} points. Cette action est définitive : il n’est pas possible de revenir en arrière.', { count: props.rows.length, target: ROUND_DRAW_TARGET_SCORE }))
const cancelLabel = computed(() => t('admin.round_draw.dialog_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.round_draw.dialog_confirm', 'Valider définitivement'))
const handleOpen = () => {
  dialogOpen.value = true
}
const handleCancel = () => {
  dialogOpen.value = false
}
const handleConfirm = () => {
  emits('validate')
}
watch(() => props.busy, (now, was) => {
  if (was && !now) {
    dialogOpen.value = false
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

<style scoped lang="scss">
.round-draw-recap {
  padding: var(--round-draw-recap---padding, var(--origam-space---6));

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

  &__empty {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__action {
    display: grid;
    justify-items: start;
    margin-top: var(--origam-space---4);
  }

  &__why {
    margin: var(--origam-space---3) 0 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }
}
</style>

<style>
:root {
  --round-draw-recap---padding: var(--origam-space---6);
}
</style>
