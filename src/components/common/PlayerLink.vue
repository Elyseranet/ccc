<template>
  <origam-btn
    :to="profilePath"
    variant="text"
    :size="size"
    rounded="full"
    :wrap="wrap"
    font-weight="semibold"
    class="player-link"
    :class="linkClasses"
    data-cy="player-link"
  >
    <template #default>
      <span class="player-link__name">{{ competitor.displayName }}</span>
      <template v-if="hasTitles && flow">
        {{ ' ' }}
      </template>
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
  size: PLAYER_LINK_DEFAULT_SIZE,
  inline: false,
  wrap: false,
  flow: false
})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Fiche et titres
 *
 * @description
 * Avec `wrap`, le nom coule comme du texte et passe à la ligne (prop `wrap` d'OrigamBtn). C'est un choix de l'appelant, jamais du mode
 * `inline` : l'annuaire des joueurs garde son nom sur une ligne (mesuré : 0,2 % contre 3,4 % à 390 px). Origam
 * centre alors les lignes et fixe `justify-content: center` en dur sur `__content` (OrigamBtn.vue:1185-1188, sans variable).
 * Le bloc style remet donc l'alignement au début par `:deep`, justifié par docs/tickets/origam/btn-content-alignement-non-themable.md.
 * Avec `flow`, le lien n'est plus un bouton en ligne (boîte atomique) mais du texte en ligne : le nom, ses étoiles et le texte voisin
 * passent à la ligne comme dans une phrase (chronologie des titres, maquette `.champ__final`). Le focus se dessine autour de chaque fragment.
 * Le singulier et le pluriel ont chacun leur clé : pas de syntaxe de pluriel i18n dans ce projet.
 ********************************************************/
const profilePath = computed(() => `/joueurs/${encodeURIComponent(props.competitor.id)}`)
const linkClasses = computed(() => ({ 'player-link--inline': props.inline, 'player-link--wrap': props.wrap, 'player-link--flow': props.flow }))
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
  &--inline {
    --origam-btn---height: auto;
    --origam-btn---min-height: 0;
    --origam-btn---min-width: 0;
    --origam-btn---font-size: 1em;
    --origam-btn---line-height: var(--origam-font__lineHeight---normal);
    padding-inline: 0;
  }

  &.player-link--flow {
    display: inline;
    font-weight: inherit;
    letter-spacing: inherit;
    vertical-align: baseline;

    :deep(.origam-btn__loader),
    :deep(.origam-btn__content) {
      display: inline;
    }

    .player-link__stars {
      margin-inline-start: 0;
    }
  }

  &--wrap :deep(.origam-btn__content) {
    justify-content: flex-start;
    text-align: start;
  }

  // Disposition du contenu (nom et étoiles) pilotée par variables : OrigamBtn n'expose ni la direction, ni l'alignement, ni l'écart de son
  // `.origam-btn__content` (flex, `OrigamBtn.vue:1162-1169`) : Elyseranet/origam#1304. Les valeurs par défaut sont celles d'Origam.
  :deep(.origam-btn__content) {
    flex-direction: var(--player-link---content-direction, row);
    align-items: var(--player-link---content-align, center);
    gap: var(--player-link---content-gap, 0);
  }

  &__stars {
    margin-inline-start: var(--player-link---stars-margin, var(--origam-space---1));
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
