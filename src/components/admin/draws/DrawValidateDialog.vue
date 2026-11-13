<template>
  <confirm-dialog
    :open="open"
    :busy="busy"
    :title="title"
    :text="text"
    :warning="warning"
    :cancel-label="cancelLabel"
    :confirm-label="confirmLabel"
    cy-prefix="draw-validate"
    @cancel="emits('cancel')"
    @confirm="emits('confirm')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import { useT } from '~/composables/useT'
import type { IDrawValidateDialogProps } from '~/interfaces/pool-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * Confirmation de la validation du tirage : les textes sont ceux du tirage, le dialogue est `ConfirmDialog` (partagé avec la qualification, F-24).
 * Le bouton « Valider définitivement » est en `danger` (valeur par défaut du composant partagé).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawValidateDialogProps>(), {})
const emits = defineEmits<{ (event: 'cancel'): void, (event: 'confirm'): void }>()
defineSlots<{}>()
const title = computed(() => t('admin.draws.validate_title', 'Valider le tirage des poules ?'))
const text = computed(() => t('admin.draws.validate_text', '{total} joueurs, {pools} poules. Les affectations seront figées et les {matches} matchs de poule générés.', { total: props.total, pools: props.poolCount, matches: props.matchCount }))
const warning = computed(() => t('admin.draws.validate_warning', 'Cette action n’est pas annulable.'))
const cancelLabel = computed(() => t('admin.draws.validate_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.draws.validate_confirm', 'Valider définitivement'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>
