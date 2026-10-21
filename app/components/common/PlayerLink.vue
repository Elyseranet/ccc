<template>
  <origam-btn
    :to="profilePath"
    variant="text"
    :size="size"
    rounded="full"
    font-weight="semibold"
    class="player-link"
    data-cy="player-link"
  >
    <template #default>
      <span class="player-link__name">{{ competitor.displayName }}</span>
      <span
        v-if="hasTitles"
        class="player-link__stars"
        aria-hidden="true"
      >{{ stars }}</span>
      <span
        v-if="hasTitles"
        class="sr-only"
      >{{ titlesLabel }}</span>
    </template>
  </origam-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn } from 'origam/components'
import { useT } from '~/composables/useT'
import { PLAYER_LINK_DEFAULT_SIZE } from '~/consts/player-link.const'
import type { IPlayerLinkProps } from '~/interfaces/common-components.interface'

/*********************************************************
 * Global
 *
 * @description
 * Tout nom de joueur mène à sa fiche. Une étoile par titre (RG6) : les astérisques sont décoratifs,
 * le nombre de titres est annoncé en texte pour les lecteurs d'écran.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPlayerLinkProps>(), {
  titles: 0,
  size: PLAYER_LINK_DEFAULT_SIZE
})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Fiche et titres
 *
 * @description
 * Le singulier et le pluriel ont chacun leur clé : pas de syntaxe de pluriel i18n dans ce projet.
 ********************************************************/
const profilePath = computed(() => `/joueurs/${encodeURIComponent(props.competitor.id)}`)
const hasTitles = computed(() => props.titles > 0)
const stars = computed(() => '*'.repeat(props.titles))
const titlesLabel = computed(() => props.titles === 1
  ? t('components.player_link.title_one', '1 titre')
  : t('components.player_link.title_other', '{count} titres', { count: props.titles }))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.player-link {
  &__stars {
    margin-inline-start: var(--origam-space---1);
    color: var(--player-link---stars-color, var(--origam-color__bar---amber));
    letter-spacing: 0.08em;
    font-weight: var(--origam-font__weight---bold);
  }
}
</style>

<style>
:root {
  --player-link---stars-color: var(--origam-color__bar---amber);
}
</style>
