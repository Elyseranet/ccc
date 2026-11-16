<template>
  <confirm-dialog
    :open="open"
    :busy="busy"
    :title="title"
    text=""
    :cancel-label="cancelLabel"
    :confirm-label="confirmLabel"
    confirm-color="primary"
    :appearance="appearance"
    cy-prefix="draw-restart"
    @cancel="emits('cancel')"
    @confirm="emits('confirm')"
  >
    <template #default>
      <p class="draw-restart-dialog__text">
        {{ before }} <strong>{{ bold }}</strong> {{ after }}
      </p>
      <p class="draw-restart-dialog__text">
        {{ again }}
      </p>
    </template>
  </confirm-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import { useT } from '~/composables/useT'
import { CONFIRM_DIALOG_APPEARANCE } from '~/enums/confirm-dialog.enum'
import { DRAW_KIND } from '~/enums/draw.enum'
import type { IDrawRestartDialogProps } from '~/interfaces/random-draw-screen.interface'

/*********************************************************
 * Global
 *
 * @description
 * Confirmation de « Recommencer le tirage… » (F-52) : sans `persistent`, Échap annule, focus initial sur « Annuler » (ConfirmDialog). Le nombre réel d'éléments effacés est en gras.
 * Les têtes de série restent placées en poules ; un tour repart vide.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawRestartDialogProps>(), {})
const emits = defineEmits<{ (event: 'cancel'): void, (event: 'confirm'): void }>()
defineSlots<{}>()
const appearance = CONFIRM_DIALOG_APPEARANCE.MOCKUP
const isPool = computed(() => props.kind === DRAW_KIND.POOLS)
const title = computed(() => (isPool.value
  ? t('admin.random_draw.restart_title_pools', 'Recommencer le tirage des poules ?')
  : t('admin.random_draw.restart_title_round', 'Recommencer le tirage {round} ?', { round: props.roundText })))
const before = computed(() => t('admin.random_draw.restart_before', 'Les'))
const bold = computed(() => (isPool.value
  ? t('admin.random_draw.restart_bold_pools', '{count} joueurs placés', { count: props.count })
  : t('admin.random_draw.restart_bold_round', '{count} affiches du brouillon seront effacées', { count: props.count })))
const after = computed(() => (isPool.value
  ? t('admin.random_draw.restart_after_pools', '(têtes de série non comprises) seront retirés de leur poule. Leur placement ne pourra pas être récupéré.')
  : t('admin.random_draw.restart_after_round', 'et ne pourront pas être récupérées.')))
const again = computed(() => (isPool.value
  ? t('admin.random_draw.restart_again_pools', 'Le tirage repart du premier joueur, au sort ou à la main.')
  : t('admin.random_draw.restart_again_round', 'Le tirage repart de la première affiche, au sort ou à la main.')))
const cancelLabel = computed(() => t('admin.random_draw.restart_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.random_draw.restart_confirm', 'Effacer et recommencer'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.draw-restart-dialog {
  &__text {
    margin: 0 0 var(--origam-space---2);
    color: var(--origam-color__text---primary);
    font-size: var(--origam-font__size---md);
    line-height: var(--origam-font__lineHeight---normal);
  }
}
</style>
