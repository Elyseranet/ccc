<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    padding="0"
    class="draw-random-band"
    :aria-labelledby="titleId"
    data-cy="draw-random-band"
  >
    <template #default>
      <div class="draw-random-band__text">
        <p
          :id="titleId"
          class="draw-random-band__title"
          data-cy="draw-random-title"
        >
          {{ title }}
        </p>
        <p class="draw-random-band__lead">
          {{ lead }}
        </p>
      </div>
      <div class="draw-random-band__actions">
        <origam-btn
          v-if="canRestart"
          variant="text"
          color="primary"
          size="small"
          font-size="sm"
          padding-inline="4"
          class="draw-random-band__restart"
          aria-haspopup="dialog"
          :text="restartLabel"
          data-cy="draw-restart-open"
          @click="handleRestart"
        />
        <origam-btn
          v-if="showDraw"
          variant="flat"
          :bg-color="buttonColor"
          :elevation="buttonElevation"
          size="large"
          font-size="md"
          class="draw-random-band__draw"
          :loading="drawing"
          :disabled="disabled"
          :prepend-icon="capsuleIcon"
          :text="drawLabel"
          data-cy="draw-random"
          @click="handleDraw"
        />
      </div>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamBtn, OrigamCard } from 'origam/components'
import IconCapsule from '~/components/icons/IconCapsule.vue'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import { DRAW_KIND } from '~/enums/draw.enum'
import type { IDrawRandomBandProps } from '~/interfaces/random-draw-screen.interface'

/*********************************************************
 * Global
 *
 * @description
 * Bande « Tirer au sort avec l'application » au-dessus de la saisie physique (F-52) : un clic tire une étape sur le serveur et ouvre l'écran projecteur (le parent s'en charge).
 * Brouillon complet : plus de tirage, la validation existante prend le relais ; « Recommencer le tirage… » est proposé dès qu'un élément a été tiré (confirmation au parent).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawRandomBandProps>(), {})
const emits = defineEmits<{ (event: 'draw'): void, (event: 'restart'): void }>()
defineSlots<{}>()
const titleId = useId()
const capsuleIcon = IconCapsule
const isBlocked = computed(() => props.disabled)
const { buttonColor, buttonElevation } = usePrimaryActionButton(isBlocked)
const isPool = computed(() => props.kind === DRAW_KIND.POOLS)
const canRestart = computed(() => props.restartable && !props.disabled && !props.final)
const showDraw = computed(() => props.final || !props.complete)
const title = computed(() => {
  if (props.final) {
    return t('admin.random_draw.final_title', 'La finale')
  }
  if (!props.complete) {
    return t('admin.random_draw.band_title', 'Tirer au sort avec l’application')
  }
  return isPool.value
    ? t('admin.random_draw.complete_title_pools', 'Les {count} joueurs sont placés', { count: props.total })
    : t('admin.random_draw.complete_title_round', 'Les {count} affiches sont tirées', { count: props.total })
})
const lead = computed(() => {
  if (props.final) {
    return t('admin.random_draw.final_lead', 'Un clic tire l’affiche entre les deux finalistes, crée le match de finale et l’affiche en grand, pour la salle.')
  }
  if (props.complete) {
    return isPool.value
      ? t('admin.random_draw.complete_lead_pools', 'Relisez les poules, corrigez un joueur avec « Changer » si besoin, puis validez le tirage. Rien n’est définitif avant la validation.')
      : t('admin.random_draw.complete_lead_round', 'Relisez les affiches, corrigez-en une avec « Changer » si besoin, puis validez le tirage. Rien n’est définitif avant la validation.')
  }
  return isPool.value
    ? t('admin.random_draw.band_lead_pools', 'Un clic tire un joueur au hasard parmi les restants et l’affiche en grand avec sa poule, pour la salle. Les têtes de série restent celles de l’étape 2. Le tirage reste un brouillon.')
    : t('admin.random_draw.band_lead_round', 'Un clic tire l’affiche suivante parmi les joueurs restants et l’affiche en grand, pour la salle. Le tirage reste un brouillon : vous relisez, corrigez si besoin, puis validez.')
})
const drawLabel = computed(() => {
  if (props.drawing) {
    return t('admin.random_draw.drawing', 'Tirage en cours…')
  }
  if (props.final) {
    return t('admin.random_draw.launch_final', 'Lancer la finale')
  }
  if (isPool.value) {
    return props.started
      ? t('admin.random_draw.draw_next_player', 'Tirer le joueur suivant')
      : t('admin.random_draw.draw_first_player', 'Tirer le premier joueur')
  }
  return props.started
    ? t('admin.random_draw.draw_next_pairing', 'Tirer l’affiche suivante')
    : t('admin.random_draw.draw_first_pairing', 'Tirer la première affiche')
})
const restartLabel = computed(() => t('admin.random_draw.restart_open', 'Recommencer le tirage…'))
const handleDraw = () => {
  emits('draw')
}
const handleRestart = () => {
  emits('restart')
}

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.draw-random-band {
  margin-bottom: var(--origam-space---4);
  background-image: radial-gradient(30rem 12rem at 100% 0%, color-mix(in srgb, var(--origam-color__bar---neon) 22%, transparent), transparent 70%);

  :deep(.origam-card__content) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3) var(--origam-space---5);
    padding: var(--origam-space---4) var(--origam-space---5);
  }

  &__text {
    display: grid;
    flex: 1 1 18rem;
    gap: var(--origam-space---1);
    min-width: 0;
  }

  &__title,
  &__lead {
    margin: 0;
  }

  &__title {
    font-weight: var(--origam-font__weight---bold);
  }

  &__lead {
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--origam-space---2);
  }

  // Gabarit de la maquette (`.btn` : 24 px de chaque côté, 8 px entre la capsule et le libellé) ; doublé pour passer devant le calcul de rembourrage d'origam-btn.
  &__restart#{&}__restart {
    min-height: var(--origam-space---11);
  }

  &__draw#{&}__draw {
    min-height: var(--origam-space---12);
    padding-inline: var(--origam-space---6);

    :deep(.origam-btn__prepend) {
      margin-inline: 0 var(--origam-space---2);
    }
  }

  &__draw:hover :deep(.icon-capsule) {
    rotate: 90deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .draw-random-band__draw:hover :deep(.icon-capsule) {
    rotate: none;
  }
}
</style>
