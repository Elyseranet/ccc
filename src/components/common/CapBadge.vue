<template>
  <svg
    class="cap-badge"
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
      class="cap-badge__text"
      x="50"
      :y="textY"
      text-anchor="middle"
    >
      {{ text }}
    </text>
  </svg>
</template>

<script setup lang="ts">
import { BRAND_CAP_POINTS } from '~/consts/brand.const'
import type { ICapBadgeProps } from '~/interfaces/common-components.interface'

/*********************************************************
 * Global
 *
 * @description
 * Capsule décorative portant un court texte (le code d'une erreur, par exemple). Elle est `aria-hidden` : l'information
 * est déjà dans le texte de la page. Les capsules à chiffre de l'édition et de l'accueil dessinent chacune la leur ;
 * elles pourraient s'appuyer sur celle-ci : même polygone, même rond intérieur, texte à y = 58 par défaut (valeur de ces
 * capsules), taille, graisse et couleurs réglées par les variables `--cap-badge__*`.
 ********************************************************/
const props = withDefaults(defineProps<ICapBadgeProps>(), {
  textY: 58
})
const emits = defineEmits<{}>()
defineSlots<{}>()
const capPoints = BRAND_CAP_POINTS

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
    font-size: var(--cap-badge__text---font-size, 26px);
    font-weight: var(--cap-badge__text---font-weight, 400);
  }
}
</style>

<style>
:root {
  --cap-badge__text---font-size: 26px;
}
</style>
