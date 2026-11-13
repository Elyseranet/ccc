<template>
  <confirm-dialog
    :open="open"
    :busy="busy"
    :title="title"
    :text="text"
    :warning="warning"
    :cancel-label="cancelLabel"
    :confirm-label="confirmLabel"
    cy-prefix="round-draw-change"
    confirm-color="primary"
    confirm-elevation="lg"
    :appearance="appearance"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <template #default>
      <round-kind-radios
        :model-value="selected"
        :kinds="choices"
        :legend="legend"
        data-cy="round-draw-change-radios"
        @update:model-value="handleSelect"
      />
    </template>
  </confirm-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RoundKindRadios from '~/components/admin/round-draw/RoundKindRadios.vue'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import { useT } from '~/composables/useT'
import { CONFIRM_DIALOG_APPEARANCE } from '~/enums/confirm-dialog.enum'
import type { ROUND_KIND } from '~/enums/round.enum'
import type { IRoundDrawChangeDialogEmits, IRoundDrawChangeDialogProps } from '~/interfaces/round-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * « Changer de tour ? » : un nouveau tour parmi ceux que le serveur autorise, annonce du nombre RÉEL d'affiches perdues (la phrase de perte est absente sans affiche enregistrée),
 * « Remplacer le brouillon » = un nouveau `POST` du brouillon. Sans `persistent` (hors envoi) : Échap annule, le focus initial est sur « Annuler » (`ConfirmDialog`). Le tour actuel
 * n'est pas proposé. Le refus 409 (tirage validé) est affiché par la page.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IRoundDrawChangeDialogProps>(), {})
const emits = defineEmits<IRoundDrawChangeDialogEmits>()
defineSlots<{}>()
const appearance = CONFIRM_DIALOG_APPEARANCE.MOCKUP
const choices = computed(() => props.allowedRoundKinds.filter(kind => kind !== props.currentKind))
const selected = ref<ROUND_KIND | null>(choices.value[0] ?? null)
watch(choices, (kinds) => {
  if (selected.value === null || !kinds.includes(selected.value)) {
    selected.value = kinds[0] ?? null
  }
})
const title = computed(() => t('admin.round_draw.change_title', 'Changer de tour ?'))
const text = computed(() => t('admin.round_draw.change_text', 'Le brouillon actuel sera remplacé et ne pourra pas être récupéré. Vous repartez d’un nouveau brouillon avec le tour choisi.'))
const warning = computed(() => props.savedPairings === 0
  ? ''
  : (props.savedPairings === 1
    ? t('admin.round_draw.change_lost_one', 'L’affiche déjà enregistrée sera perdue.')
    : t('admin.round_draw.change_lost_other', 'Les {count} affiches déjà enregistrées seront perdues.', { count: props.savedPairings })))
const legend = computed(() => t('admin.round_draw.change_legend', 'Nouveau tour'))
const cancelLabel = computed(() => t('admin.round_draw.change_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.round_draw.change_confirm', 'Remplacer le brouillon'))
const handleSelect = (value: ROUND_KIND) => {
  selected.value = value
}
const handleCancel = () => {
  emits('cancel')
}
const handleConfirm = () => {
  if (selected.value) {
    emits('confirm', selected.value)
  }
}

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>
