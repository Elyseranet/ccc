<template>
  <svg
    class="cap-badge"
    :style="toneStyle"
    viewBox="0 0 100 100"
    aria-hidden="true"
    focusable="false"
  >
    <polygon
      class="cap-badge__shape"
      :points="capPoints"
    />
    <circle
      class="cap-badge__inner"
      cx="50"
      cy="50"
      r="31"
    />
    <text
      v-if="text !== undefined"
      class="cap-badge__text"
      x="50"
      :y="textY"
      :font-size="textSize"
      text-anchor="middle"
    >
      {{ text }}
    </text>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BRAND_CAP_POINTS } from '~/consts/brand.const'
import { CAP_BADGE_DEFAULT_TEXT_SIZE, CAP_BADGE_DEFAULT_TEXT_Y, CAP_TONE_FILL } from '~/consts/cap-badge.const'
import { CAP_TONE } from '~/enums/cap-tone.enum'
import type { ICapBadgeProps } from '~/interfaces/common-components.interface'

/*********************************************************
 * Global
 *
 * @description
 * La capsule décorative, définie ici une seule fois (F-23) : polygone de la marque, rond intérieur, texte facultatif (le code d'une erreur, un nombre de
 * titres, le nom de la marque). Elle est `aria-hidden` : l'information est déjà dans le texte de la page. Texte, position et taille du texte (unités
 * du viewBox) et teinte de la coque se règlent par props ; la taille, la rotation, l'opacité, la position et l'animation sont celles du parent, qui
 * pose sa classe sur le `svg` (les attributs retombent sur la racine).
 ********************************************************/
const props = withDefaults(defineProps<ICapBadgeProps>(), {
  text: undefined,
  textY: CAP_BADGE_DEFAULT_TEXT_Y,
  textSize: CAP_BADGE_DEFAULT_TEXT_SIZE,
  tone: CAP_TONE.AMBER
})
const emits = defineEmits<{}>()
defineSlots<{}>()
const capPoints = BRAND_CAP_POINTS
const toneStyle = computed(() => ({ '--cap-badge__shape---fill': CAP_TONE_FILL[props.tone] }))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.cap-badge {
  display: block;

  &__shape {
    fill: var(--cap-badge__shape---fill, var(--origam-color__bar---amber));
  }

  &__inner {
    fill: var(--cap-badge__inner---fill, var(--origam-color__surface---default));
  }

  &__text {
    fill: var(--cap-badge__text---fill, var(--origam-color__bar---foam));
    font-family: var(--origam-font__family---display);
    font-weight: var(--cap-badge__text---font-weight, 400);
  }
}
</style>

<style>
:root {
  --cap-badge__inner---fill: var(--origam-color__surface---default);
  --cap-badge__text---fill: var(--origam-color__bar---foam);
}
</style>
