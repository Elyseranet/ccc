<template>
  <teleport to="body">
    <div
      ref="rootRef"
      class="draw-projector"
      :class="rootClasses"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      data-cy="draw-projector"
      @keydown="handleKeydown"
      @animationend="handleAnimationEnd"
    >
      <div
        class="draw-projector__rays"
        aria-hidden="true"
      />
      <div
        class="draw-projector__flash"
        aria-hidden="true"
      />
      <header class="draw-projector__top">
        <span class="draw-projector__brand font-display">
          <cap-badge
            class="draw-projector__brand-cap"
            aria-hidden="true"
          />
          <span>{{ brand }}</span>
        </span>
        <origam-title
          :id="titleId"
          tag="h2"
          class="draw-projector__title"
          :text="title"
        />
        <p
          class="draw-projector__step"
          data-cy="draw-projector-step"
        >
          {{ counter }}
        </p>
      </header>
      <section
        class="draw-projector__stage"
        :aria-label="stageLabel"
      >
        <template v-if="isPairing">
          <div class="draw-projector__name draw-projector__name--a">
            <span
              class="draw-projector__cap"
              aria-hidden="true"
            >
              <cap-badge class="draw-projector__cap-svg" />
            </span>
            <span
              class="draw-projector__player font-display"
              data-cy="draw-projector-first"
            >{{ firstName }}</span>
          </div>
          <p class="draw-projector__vs font-display neon">
            <span aria-hidden="true">{{ versusMark }}</span>
            <span class="sr-only">{{ versusLabel }}</span>
          </p>
          <div class="draw-projector__name draw-projector__name--b">
            <span
              class="draw-projector__cap"
              aria-hidden="true"
            >
              <cap-badge class="draw-projector__cap-svg" />
            </span>
            <span
              class="draw-projector__player font-display"
              data-cy="draw-projector-second"
            >{{ secondName }}</span>
          </div>
        </template>
        <template v-else>
          <div class="draw-projector__name draw-projector__name--a">
            <span
              class="draw-projector__cap"
              aria-hidden="true"
            >
              <cap-badge class="draw-projector__cap-svg" />
            </span>
            <span
              class="draw-projector__player font-display"
              data-cy="draw-projector-first"
            >{{ firstName }}</span>
          </div>
          <p class="draw-projector__into">
            {{ intoLabel }}
          </p>
          <p
            class="draw-projector__pool"
            data-cy="draw-projector-pool"
          >
            <cap-badge
              class="draw-projector__pool-cap"
              aria-hidden="true"
            />
            <span class="draw-projector__pool-text">
              <span class="draw-projector__pool-label">{{ poolLabel }}</span>
              <span class="draw-projector__pool-number font-display">{{ view.poolNumber }}</span>
            </span>
          </p>
        </template>
        <div
          class="draw-projector__burst"
          aria-hidden="true"
        >
          <i
            v-for="piece in burst"
            :key="piece.angle"
            :style="piece.style"
          />
        </div>
      </section>
      <div
        class="sr-only"
        aria-live="polite"
        data-cy="draw-projector-live"
      >
        {{ liveText }}
      </div>
      <footer class="draw-projector__act">
        <origam-btn
          ref="continueRef"
          variant="flat"
          :bg-color="buttonColor"
          :elevation="buttonElevation"
          size="x-large"
          class="draw-projector__continue"
          :text="continueLabel"
          data-cy="draw-continue"
          @click="handleContinue"
        />
        <origam-btn
          variant="text"
          size="small"
          class="draw-projector__skip"
          :text="skipLabel"
          data-cy="draw-skip"
          @click="handleSkip"
        />
      </footer>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { OrigamBtn, OrigamTitle } from 'origam/components'
import CapBadge from '~/components/common/CapBadge.vue'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import { RANDOM_DRAW_BURST } from '~/consts/random-draw.const'
import { DRAW_KIND } from '~/enums/draw.enum'
import type { IDrawProjectorProps } from '~/interfaces/random-draw-screen.interface'

/*********************************************************
 * Global
 *
 * @description
 * Écran de tirage plein écran pour le projecteur (F-52, maquette `admin-tirage-projection.html`) : une étape tirée par le serveur est révélée, deux noms puis « VS » en tour,
 * un nom puis sa poule en poules. Admin : animations en CSS seul (`animation-delay` en unités de `motion.duration.xslow`), aucun timer ; « Continuer » apparaît à la fin
 * et reçoit le focus à son `animationend`. « Passer l'animation » coupe tout (même rendu que `prefers-reduced-motion`, où le résultat est là d'emblée).
 * Plein écran par l'API Fullscreen quand le navigateur l'autorise, sinon l'écran couvre le viewport ; Échap (ou la sortie du plein écran) vaut « Continuer ».
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawProjectorProps>(), {})
const emits = defineEmits<{ (event: 'continue'): void }>()
defineSlots<{}>()
const titleId = useId()
const { buttonColor, buttonElevation } = usePrimaryActionButton(ref(false))
const rootRef = ref<HTMLElement | null>(null)
const continueRef = ref<{ $el?: HTMLElement } | null>(null)
const skipped = ref(false)
const liveText = ref('')
const isPairing = computed(() => props.view.kind === DRAW_KIND.ROUND)
const rootClasses = computed(() => ({
  'draw-projector--pairing': isPairing.value,
  'draw-projector--pool': !isPairing.value,
  'draw-projector--done': skipped.value
}))
const firstName = computed(() => props.view.names[0] ?? '')
const secondName = computed(() => props.view.names[1] ?? '')
const counter = computed(() => (props.view.final
  ? t('admin.random_draw.projector_step_final', 'Finale')
  : isPairing.value
    ? t('admin.random_draw.projector_step_pairing', 'Affiche {position} / {total}', { position: props.view.position, total: props.view.total })
    : t('admin.random_draw.projector_step_pool', 'Joueur {position} / {total}', { position: props.view.position, total: props.view.total })))
const stageLabel = computed(() => (props.view.final
  ? t('admin.random_draw.projector_step_final', 'Finale')
  : isPairing.value
    ? t('admin.random_draw.projector_stage_pairing', 'Affiche {position}', { position: props.view.position })
    : t('admin.random_draw.projector_stage_pool', 'Joueur {position}', { position: props.view.position })))
const announcement = computed(() => (props.view.final
  ? t('admin.random_draw.projector_announce_final', 'Finale : {first} contre {second}.', { first: firstName.value, second: secondName.value })
  : isPairing.value
    ? t('admin.random_draw.projector_announce_pairing', 'Affiche {position} : {first} contre {second}.', { position: props.view.position, first: firstName.value, second: secondName.value })
    : t('admin.random_draw.projector_announce_pool', '{name} rejoint la poule {pool}.', { name: firstName.value, pool: props.view.poolNumber ?? '' })))
const versusMark = computed(() => t('admin.random_draw.projector_versus_mark', 'VS'))
const versusLabel = computed(() => t('admin.random_draw.projector_versus_label', 'contre'))
const intoLabel = computed(() => t('admin.random_draw.projector_into', 'rejoint la'))
const poolLabel = computed(() => t('admin.random_draw.projector_pool', 'Poule'))
const continueLabel = computed(() => t('admin.random_draw.projector_continue', 'Continuer'))
const skipLabel = computed(() => t('admin.random_draw.projector_skip', 'Passer l’animation'))
const burst = computed(() => RANDOM_DRAW_BURST.map(piece => ({ angle: piece.angle, style: { '--a': `${piece.angle}deg`, '--r': `${piece.range}vmin` } })))

/*********************************************************
 * Focus et clavier
 *
 * @description
 * Le focus entre dans l'écran (la racine), puis passe à « Continuer » dès qu'il apparaît : à son `animationend`, ou tout de suite sous `prefers-reduced-motion`
 * et après « Passer l'animation » (aucune animation, donc aucun événement). Tab reste dans l'écran ; Échap vaut « Continuer ».
 ********************************************************/
const continueButton = (): HTMLElement | null => {
  const element = continueRef.value?.$el
  return element?.matches?.('button') ? element : (element?.querySelector?.('button') ?? null)
}
const focusContinue = () => {
  continueButton()?.focus()
}
const handleAnimationEnd = (event: AnimationEvent) => {
  if (event.target instanceof HTMLElement && event.target.matches('[data-cy="draw-continue"]')) {
    focusContinue()
  }
}
const visibleButtons = (): HTMLElement[] =>
  Array.from(rootRef.value?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? []).filter(button => getComputedStyle(button).visibility !== 'hidden' && button.getClientRects().length > 0)
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    emits('continue')
    return
  }
  if (event.key !== 'Tab') {
    return
  }
  const buttons = visibleButtons()
  const first = buttons[0]
  const last = buttons[buttons.length - 1]
  if (!first || !last) {
    event.preventDefault()
    return
  }
  if (event.shiftKey && (document.activeElement === first || document.activeElement === rootRef.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
const handleContinue = () => {
  emits('continue')
}
const handleSkip = async () => {
  skipped.value = true
  await nextTick()
  focusContinue()
}

/*********************************************************
 * Plein écran et annonce
 *
 * @description
 * La région live existe dès le montage et reçoit son texte au tick suivant : annonce immédiate, sans attendre l'animation ni le plein écran. `requestFullscreen` est ensuite
 * tenté (le clic qui a lancé le tirage donne le geste) ; un refus laisse l'écran en recouvrement plein viewport. Quitter le plein écran (Échap, que le navigateur garde pour
 * lui) revient à la liste.
 ********************************************************/
let enteredFullscreen = false
let closing = false
const handleFullscreenChange = () => {
  if (document.fullscreenElement === rootRef.value) {
    enteredFullscreen = true
  } else if (enteredFullscreen && !closing) {
    emits('continue')
  }
}
onMounted(async () => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  rootRef.value?.focus()
  await nextTick()
  liveText.value = announcement.value
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    focusContinue()
  }
  try {
    await rootRef.value?.requestFullscreen?.()
  } catch {
    enteredFullscreen = false
  }
})
onBeforeUnmount(() => {
  closing = true
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => undefined)
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
.draw-projector {
  --u: var(--origam-motion__duration---xslow);
  --draw-projector__name---duration: calc(var(--u) * 1.2);
  --draw-projector__second---delay: calc(var(--u) * 1.4);
  --draw-projector__climax---delay: calc(var(--u) * 2.8);
  --draw-projector__end---delay: calc(var(--u) * 3.6);

  position: fixed;
  z-index: var(--draw-projector---z-index, 2400);
  inset: 0;
  isolation: isolate;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  padding: clamp(var(--origam-space---4), 3vh, var(--origam-space---10)) clamp(var(--origam-space---4), 4vw, var(--origam-space---16));
  background:
    radial-gradient(ellipse 70% 60% at 50% 55%, color-mix(in srgb, var(--origam-color__bar---glow) 70%, transparent), transparent 70%),
    var(--origam-color__bar---night);
  color: var(--origam-color__bar---foam);

  &:focus {
    outline: none;
  }

  &--pool {
    --draw-projector__climax---delay: calc(var(--u) * 1.4);
    --draw-projector__end---delay: calc(var(--u) * 2.6);
  }

  &__rays {
    position: absolute;
    z-index: -1;
    inset: -50%;
    background: repeating-conic-gradient(from 0deg at 50% 50%, color-mix(in srgb, var(--origam-color__bar---amber) 9%, transparent) 0deg 6deg, transparent 6deg 18deg);
    mask-image: radial-gradient(circle at 50% 50%, black 0, transparent 45%);
    opacity: 0.7;
    animation:
      projector-spin calc(var(--u) * 60) linear infinite,
      projector-rays var(--u) var(--origam-motion__easing---decelerate) var(--draw-projector__climax---delay) both;
  }

  &__top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3) var(--origam-space---6);
  }

  &__brand {
    display: inline-flex;
    align-items: center;
    gap: var(--origam-space---2);
    min-height: var(--origam-space---11);
    font-size: clamp(var(--origam-font__size---lg), 2.2vw, var(--origam-font__size---3xl));
    line-height: 1;
  }

  &__brand-cap {
    width: var(--origam-space---8);
    height: var(--origam-space---8);
    --cap-badge__inner---fill: var(--origam-color__surface---default);
  }

  &__title {
    margin: 0;
    color: var(--origam-color__bar---ice);
    font-size: clamp(var(--origam-font__size---lg), 2.4vw, var(--origam-font__size---3xl));
    line-height: var(--origam-font__lineHeight---normal);
    font-weight: var(--origam-font__weight---extrabold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
  }

  &__step {
    margin: 0;
    font-size: clamp(var(--origam-font__size---md), 2vw, var(--origam-font__size---2xl));
    line-height: var(--origam-font__lineHeight---normal);
    font-weight: var(--origam-font__weight---bold);
    font-variant-numeric: tabular-nums;
  }

  &__stage {
    position: relative;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: clamp(var(--origam-space---2), 2vh, var(--origam-space---6));
    text-align: center;
  }

  &__name {
    position: relative;
    display: grid;
    place-items: center;
    min-width: 0;
    max-width: 100%;

    &--b {
      --draw-projector__name---delay: var(--draw-projector__second---delay);
    }
  }

  &__player {
    display: block;
    color: var(--origam-color__bar---foam);
    font-size: clamp(2.5rem, min(8.5vw, 13vh), 10rem);
    line-height: var(--origam-font__lineHeight---none);
    overflow-wrap: anywhere;
    animation: projector-name var(--draw-projector__name---duration) var(--origam-motion__easing---decelerate) var(--draw-projector__name---delay, 0s) both;
  }

  &__cap {
    position: absolute;
    left: 50%;
    top: 50%;
    width: clamp(5rem, 16vh, 11rem);
    aspect-ratio: 1;
    translate: -50% -50%;
    opacity: 0;
    pointer-events: none;
    animation: projector-cap var(--draw-projector__name---duration) var(--origam-motion__easing---decelerate) var(--draw-projector__name---delay, 0s) both;
  }

  &__cap-svg {
    width: 100%;
    height: 100%;
    --cap-badge__inner---fill: var(--origam-color__bar---night);
    filter: drop-shadow(0 8px 0 var(--origam-color__bar---neon));
  }

  &__vs {
    position: relative;
    margin: 0;
    color: var(--origam-color__bar---amber);
    font-size: clamp(4rem, min(15vw, 24vh), 17rem);
    line-height: var(--origam-font__lineHeight---none);
    rotate: -6deg;
    animation: projector-vs calc(var(--u) * 0.8) var(--origam-motion__easing---sharp) var(--draw-projector__climax---delay) both;
  }

  &__into {
    margin: 0;
    color: var(--origam-color__bar---ice);
    font-size: clamp(var(--origam-font__size---lg), 3vw, var(--origam-font__size---3xl));
    font-weight: var(--origam-font__weight---bold);
    animation: projector-name calc(var(--u) * 0.6) var(--origam-motion__easing---decelerate) var(--draw-projector__climax---delay) both;
  }

  &__pool {
    position: relative;
    display: grid;
    place-items: center;
    width: clamp(9rem, 36vh, 24rem);
    margin: 0;
    aspect-ratio: 1;
    animation: projector-vs calc(var(--u) * 0.8) var(--origam-motion__easing---sharp) var(--draw-projector__climax---delay) both;
  }

  &__pool-cap {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    --cap-badge__inner---fill: var(--origam-color__bar---night);
    filter: drop-shadow(0 10px 0 var(--origam-color__bar---neon));
  }

  &__pool-text {
    position: relative;
    display: grid;
    justify-items: center;
    line-height: var(--origam-font__lineHeight---none);
  }

  &__pool-label {
    color: var(--origam-color__bar---ice);
    font-size: clamp(var(--origam-font__size---md), 3.4vh, var(--origam-font__size---2xl));
    font-weight: var(--origam-font__weight---extrabold);
    letter-spacing: var(--origam-font__letterSpacing---widest);
    text-transform: uppercase;
  }

  &__pool-number {
    color: var(--origam-color__bar---foam);
    font-size: clamp(3.5rem, 15vh, 10rem);
  }

  &__burst {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0;
    height: 0;
    pointer-events: none;

    i {
      position: absolute;
      width: clamp(0.75rem, 2vh, 1.5rem);
      aspect-ratio: 1;
      margin: -0.5rem;
      border-radius: var(--origam-radius---full);
      background: var(--origam-color__bar---amber);
      opacity: 0;
      animation: projector-burst calc(var(--u) * 1.3) var(--origam-motion__easing---decelerate) calc(var(--draw-projector__climax---delay) + var(--u) * 0.3) both;

      &:nth-child(3n) {
        background: var(--origam-color__bar---foam);
      }

      &:nth-child(3n + 1) {
        width: clamp(0.5rem, 1.4vh, 1rem);
        background: var(--origam-color__bar---ice);
      }
    }
  }

  &--pool &__burst {
    top: 66%;
  }

  &__flash {
    position: absolute;
    z-index: -1;
    inset: 0;
    background: radial-gradient(circle at 50% 55%, color-mix(in srgb, var(--origam-color__bar---foam) 45%, transparent), transparent 55%);
    opacity: 0;
    pointer-events: none;
    animation: projector-flash var(--u) var(--origam-motion__easing---decelerate) calc(var(--draw-projector__climax---delay) + var(--u) * 0.3) both;
  }

  &__act {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--origam-space---4);
    min-height: var(--origam-space---16);
  }

  &__continue {
    min-height: var(--origam-space---16);
    padding-inline: var(--origam-space---10);
    font-size: clamp(var(--origam-font__size---lg), 2vw, var(--origam-font__size---2xl));
    animation: projector-show calc(var(--u) * 0.6) var(--origam-motion__easing---decelerate) var(--draw-projector__end---delay) both;
  }

  &__skip {
    position: absolute;
    right: clamp(var(--origam-space---4), 4vw, var(--origam-space---16));
    bottom: clamp(var(--origam-space---4), 3vh, var(--origam-space---10));
    color: var(--origam-color__bar---ice);
    animation: projector-gone 1ms linear var(--draw-projector__end---delay) forwards;
  }

  &--done * {
    animation: none !important;
  }

  &--done &__rays {
    animation: projector-spin calc(var(--u) * 60) linear infinite !important;
  }

  &--done &__skip {
    display: none;
  }
}

@keyframes projector-spin {
  to { rotate: 360deg; }
}

@keyframes projector-rays {
  from { opacity: 0.25; }
  40% { opacity: 1; }
}

@keyframes projector-name {
  0%, 40% { opacity: 0; visibility: hidden; transform: scale(0.55); filter: blur(12px); letter-spacing: 0.2em; }
  70% { opacity: 1; transform: scale(1.08); filter: blur(0); }
}

@keyframes projector-cap {
  0% { opacity: 0; transform: translateY(-70vh) rotate(-900deg) scale(0.4); }
  10% { opacity: 1; }
  32% { opacity: 1; transform: translateY(0) rotate(0) scale(1.15); }
  40% { opacity: 1; transform: scale(1) rotateY(0); }
  55%, 100% { opacity: 0; transform: scale(1.6) rotateY(90deg); }
}

@keyframes projector-vs {
  0% { opacity: 0; transform: scale(5); filter: blur(8px); }
  55% { opacity: 1; transform: scale(0.88); filter: blur(0); }
  72% { transform: scale(1.12); }
  86% { transform: scale(0.97); }
}

@keyframes projector-burst {
  0% { opacity: 0; transform: rotate(var(--a)) translateY(0) scale(0.4); }
  6%, 70% { opacity: 1; }
  100% { opacity: 0; transform: rotate(var(--a)) translateY(calc(-1 * var(--r, 38vmin))) scale(1); }
}

@keyframes projector-flash {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes projector-show {
  0% { opacity: 0; visibility: hidden; translate: 0 var(--origam-space---4); }
}

@keyframes projector-gone {
  to { visibility: hidden; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .draw-projector__skip {
    display: none;
  }
}

@media (max-width: 760px) {
  .draw-projector__skip {
    position: static;
  }

  .draw-projector__act {
    flex-direction: column-reverse;
  }
}
</style>

<style>
:root {
  --draw-projector---z-index: 2400;
}
</style>
