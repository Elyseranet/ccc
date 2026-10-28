<template>
  <origam-avatar
    class="player-avatar"
    rounded="full"
    font-size="sm"
    font-weight="bold"
    aria-hidden="true"
    :text="initials"
    :image="avatarUrl ?? undefined"
    data-cy="player-avatar"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamAvatar } from 'origam/components'
import type { IPlayerAvatarProps } from '~/interfaces/players.interface'
import { getInitials } from '~/utils/player.util'

/*********************************************************
 * Global
 *
 * @description
 * Avatar d'un joueur : la photo (`avatarUrl`) ou, à défaut, les initiales. Décoratif pour les lecteurs
 * d'écran : le nom est toujours écrit à côté.
 ********************************************************/
const props = withDefaults(defineProps<IPlayerAvatarProps>(), {
  avatarUrl: null
})
const emits = defineEmits<{}>()
defineSlots<{}>()
const initials = computed(() => getInitials(props.displayName))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.player-avatar {
  color: var(--player-avatar---color, var(--origam-color__text---primary));
  box-shadow: inset 0 0 0 2px var(--player-avatar---ring, var(--origam-color__border---default));
}
</style>

<style>
:root {
  --player-avatar---color: var(--origam-color__text---primary);
  --player-avatar---ring: var(--origam-color__border---default);
}
</style>
