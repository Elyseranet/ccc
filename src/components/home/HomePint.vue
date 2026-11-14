<template>
  <div
    class="home-pint"
    aria-hidden="true"
    data-cy="home-pint"
  >
    <svg
      class="home-pint__svg"
      viewBox="0 0 220 300"
      focusable="false"
    >
      <path
        class="home-pint__beer"
        d="M40 70 L180 70 L165 285 Q164 292 156 292 L64 292 Q56 292 55 285 Z"
      />
      <path
        class="home-pint__shade"
        d="M140 70 L180 70 L165 285 Q164 292 156 292 L130 292 Z"
      />
      <path
        class="home-pint__hi"
        d="M58 96 L66 96 L76 270 L70 270 Z"
      />
      <g class="home-pint__bubbles">
        <circle
          v-for="bubble in bubbles"
          :key="bubble.cx"
          :cx="bubble.cx"
          :cy="bubble.cy"
          :r="bubble.r"
        />
      </g>
      <path
        class="home-pint__edge"
        d="M40 70 L55 285 Q56 292 64 292 L156 292 Q164 292 165 285 L180 70"
      />
      <path
        class="home-pint__foam"
        d="M30 72 Q28 40 58 42 Q64 14 98 22 Q118 2 142 22 Q176 14 182 44 Q204 50 190 76 Q110 92 30 72 Z"
      />
      <path
        class="home-pint__drip"
        d="M58 74 Q56 104 64 110 Q72 104 70 76 Z"
      />
      <path
        class="home-pint__drip home-pint__drip--2"
        d="M160 76 Q158 122 168 126 Q176 118 172 76 Z"
      />
    </svg>
    <cap-badge
      v-for="cap in caps"
      :key="cap.modifier"
      class="home-pint__cap"
      :class="`home-pint__cap--${cap.modifier}`"
      :tone="cap.tone"
      :text="cap.label ? brandName : undefined"
      :text-size="capTextSize"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useT } from '~/composables/useT'
import CapBadge from '~/components/common/CapBadge.vue'
import { HOME_PINT_BUBBLES, HOME_PINT_CAP_TEXT_SIZE, HOME_PINT_CAPS } from '~/consts/home.const'

/*********************************************************
 * Global
 *
 * @description
 * Pinte de l'accueil et capsules en vol : décor purement graphique, masqué des lecteurs d'écran.
 * Les animations (mousse qui coule, bulles, capsules) sont en CSS et coupées sous `prefers-reduced-motion: reduce`.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const capTextSize = HOME_PINT_CAP_TEXT_SIZE
const bubbles = HOME_PINT_BUBBLES
const caps = HOME_PINT_CAPS
const brandName = computed(() => t('layout.brand_name', 'CCC'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.home-pint {
  position: relative;
  justify-self: center;
  width: min(100%, var(--home-pint---width, 24rem));

  &__svg {
    width: 100%;
    height: auto;
  }

  &__beer {
    fill: var(--origam-color__bar---amber);
  }

  &__shade {
    fill: var(--origam-color__surface---default);
    opacity: 0.18;
  }

  &__hi {
    fill: var(--origam-color__bar---foam);
    opacity: 0.45;
  }

  &__edge {
    fill: none;
    stroke: var(--origam-color__bar---foam);
    stroke-width: 3;
    opacity: 0.85;
  }

  &__foam {
    fill: var(--origam-color__bar---foam);
  }

  &__drip {
    fill: var(--origam-color__bar---foam);
    transform-box: fill-box;
    transform-origin: top;
    animation: home-pint-drip 3.2s var(--origam-motion__easing---standard) infinite;

    &--2 {
      animation-delay: -1.4s;
    }
  }

  &__bubbles circle {
    fill: var(--origam-color__bar---foam);
    opacity: 0.75;
    animation: home-pint-up 3.6s linear infinite;

    &:nth-child(2n) {
      animation-duration: 2.8s;
      animation-delay: -1s;
    }

    &:nth-child(3n) {
      animation-duration: 4.4s;
      animation-delay: -2.2s;
    }
  }

  &__cap {
    position: absolute;
    width: 5rem;
    height: auto;
    animation: home-pint-float 6s var(--origam-motion__easing---sharp) infinite alternate;

    &--one {
      top: 2%;
      right: 0;
      rotate: 16deg;
    }

    &--two {
      bottom: 14%;
      left: -4%;
      width: 3.5rem;
      rotate: -24deg;
      animation-delay: -2s;
    }

    &--three {
      top: 44%;
      right: -6%;
      width: 2.75rem;
      animation-delay: -4s;
    }
  }
}

@keyframes home-pint-drip {
  0%, 30% { transform: scaleY(0.2); }
  70%, 100% { transform: scaleY(1); }
}

@keyframes home-pint-up {
  from { transform: translateY(0); opacity: 0; }
  15% { opacity: 0.8; }
  to { transform: translateY(-190px); opacity: 0; }
}

@keyframes home-pint-float {
  to { translate: 0 -16px; rotate: 0deg; }
}

@media (max-width: 760px) {
  .home-pint {
    width: min(70%, var(--home-pint---width-mobile, 15rem));
  }
}

html[data-motion="paused"] {
  .home-pint__drip,
  .home-pint__bubbles circle,
  .home-pint__cap {
    animation-play-state: paused;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-pint__drip,
  .home-pint__bubbles circle,
  .home-pint__cap {
    animation: none;
  }
}
</style>

<style>
:root {
  --home-pint---width: 24rem;
  --home-pint---width-mobile: 15rem;
}
</style>
