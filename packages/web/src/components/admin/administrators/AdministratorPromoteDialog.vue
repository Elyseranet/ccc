<template>
  <confirm-dialog
    :open="open"
    :busy="pending"
    :title="title"
    :text="text"
    :cancel-label="cancelLabel"
    :confirm-label="confirmLabel"
    :appearance="appearance"
    cy-prefix="administrator-promote"
    confirm-color="primary"
    @cancel="emits('cancel')"
    @confirm="emits('confirm')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import { useT } from '~/composables/useT'
import { CONFIRM_DIALOG_APPEARANCE } from '~/enums/confirm-dialog.enum'
import type { IAdministratorPromoteDialogEmits, IAdministratorPromoteDialogProps } from '~/interfaces/administrator.interface'

/*********************************************************
 * Global
 *
 * @description
 * Confirmation « Nommer {nom} administrateur ? » (F-68, B-33) : l'email saisi est celui d'un compte joueur, que le serveur ne promeut qu'avec
 * `confirmPromotion: true`. Un changement de droits se confirme : focus initial sur « Annuler », Échap annule. Le texte dit ce que garde le compte
 * (fiche, mot de passe) et qu'il est prévenu par mail. Le parent ferme la boîte quand la promotion a réussi.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAdministratorPromoteDialogProps>(), {})
const emits = defineEmits<IAdministratorPromoteDialogEmits>()
defineSlots<{}>()
const appearance = CONFIRM_DIALOG_APPEARANCE.MOCKUP
const open = computed(() => props.promotion !== null)
const name = computed(() => props.promotion?.displayName ?? '')
const title = computed(() => t('admin.administrators.promote_title', 'Nommer {name} administrateur ?', { name: name.value }))
const params = computed(() => ({ email: props.promotion?.email ?? '', name: name.value }))
const text = computed(() => t('admin.administrators.promote_text', '{email} est l’email du compte joueur de {name}. Ce compte deviendra administrateur : il garde sa fiche et son mot de passe. Il est prévenu par mail.', params.value))
const cancelLabel = computed(() => t('admin.account.dialog_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.administrators.promote_confirm', 'Nommer administrateur'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>
