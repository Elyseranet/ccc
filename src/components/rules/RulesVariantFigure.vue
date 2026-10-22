<template>
  <svg
    class="rules-variant-figure"
    viewBox="0 0 120 108"
    role="img"
    :aria-label="label"
  >
    <g
      v-if="hasBars"
      class="rules-variant-figure__podium"
    >
      <rect
        v-for="bar in variant.bars"
        :key="`${bar.x}-${bar.y}`"
        :x="bar.x"
        :y="bar.y"
        :width="bar.width"
        :height="bar.height"
      />
    </g>
    <g
      v-for="beer in variant.beers"
      :key="`${beer.x}-${beer.y}`"
      class="rules-variant-figure__beer"
    >
      <circle
        :cx="beer.x"
        :cy="beer.y"
        :r="beer.radius"
      />
      <circle
        class="rules-variant-figure__cap"
        :cx="beer.x"
        :cy="beer.y"
        :r="beer.capRadius"
      />
    </g>
    <g
      v-if="hasLabels"
      class="rules-variant-figure__labels"
      font-size="10"
      aria-hidden="true"
    >
      <text
        v-for="entry in labels"
        :key="entry.x"
        :x="entry.x"
        :y="entry.y"
      >
        {{ entry.text }}
      </text>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useT } from '~/composables/useT'
import type { IRulesVariantFigureProps } from '~/interfaces/rules.interface'

/*********************************************************
 * Global
 *
 * @description
 * Schéma SVG d'une variante (vue du dessus ou de face). `role="img"` avec un libellé qui décrit la disposition.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IRulesVariantFigureProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Textes
 *
 * @description
 * Les lettres G, C et D du podium sont décoratives : le libellé de l'image dit déjà la disposition.
 ********************************************************/
const label = computed(() => t(props.variant.figureLabel.key, props.variant.figureLabel.fallback))
const hasBars = computed(() => (props.variant.bars?.length ?? 0) > 0)
const hasLabels = computed(() => (props.variant.labels?.length ?? 0) > 0)
const labels = computed(() => (props.variant.labels ?? []).map(entry => ({ x: entry.x, y: entry.y, text: t(entry.text.key, entry.text.fallback) })))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.rules-variant-figure {
  width: 100%;
  aspect-ratio: 10 / 9;
  padding: var(--rules-variant-figure---padding, var(--origam-space---4));
  border-radius: var(--origam-radius---lg);
  background: var(--origam-color__surface---sunken);

  &__beer circle:first-child {
    fill: var(--origam-color__bar---amber);
    stroke: var(--origam-color__bar---foam);
    stroke-width: 1.5;
  }

  &__cap {
    fill: var(--origam-color__bar---neon);
  }

  &__podium rect {
    fill: var(--origam-color__surface---overlay);
    stroke: var(--origam-color__border---strong);
  }

  &__labels text {
    fill: var(--origam-color__text---secondary);
    font-family: var(--origam-font__family---sans);
    font-weight: var(--origam-font__weight---bold);
    text-anchor: middle;
  }
}
</style>

<style>
:root {
  --rules-variant-figure---padding: var(--origam-space---4);
}
</style>
