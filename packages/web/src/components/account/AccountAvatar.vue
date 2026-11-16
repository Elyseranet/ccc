<template>
  <origam-avatar
    :size="avatarSize"
    rounded="full"
    bg-color="primary"
    font-size="xl"
    class="account-avatar font-display"
    aria-hidden="true"
    :text="initials"
    :image="avatarUrl ?? undefined"
    data-cy="account-avatar"
  />
</template>

<script setup lang="ts">
import { OrigamAvatar } from 'origam/components'
import { ACCOUNT_AVATAR_PREVIEW_SIZE } from '~/consts/account.const'
import type { IAccountAvatarProps } from '~/interfaces/account.interface'

/*********************************************************
 * Global
 *
 * @description
 * L'avatar de grande taille des écrans du compte : l'image du compte (carrée, recadrée par `object-fit: cover`, 512 px au
 * plus) ou, à défaut, les initiales. Décoratif pour les lecteurs d'écran : le nom est toujours écrit à côté.
 ********************************************************/
const props = withDefaults(defineProps<IAccountAvatarProps>(), {
  avatarUrl: null
})
const emits = defineEmits<{}>()
defineSlots<{}>()
const avatarSize = ACCOUNT_AVATAR_PREVIEW_SIZE

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.account-avatar {
  flex: none;
}
</style>
