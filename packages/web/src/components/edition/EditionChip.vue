
<template>
  <origam-chip
    v-bind="chipProps"
    :text="text"
    class="edition-chip"
  >
    <template
      v-if="srText"
      #default
    >
      <span aria-hidden="true">{{ text }}</span>
      <span class="sr-only">{{ srText }}</span>
    </template>
  </origam-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamChip } from 'origam/components'
import { EDITION_CHIP_PROPS } from '~/consts/edition-view.const'
import type { IEditionChipProps } from '~/interfaces/edition-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Pastille de l'édition : la famille (neutre, teintée succès ou info, pleine secondaire) donne les props d'`origam-chip`
 * (recette des chips, mapping.md). La famille neutre ne pose rien : le défaut du thème fait foi (F-00n).
 * `srText` : pour une pastille faite d'une abréviation (« Q »), le texte visible est masqué aux lecteurs d'écran et remplacé par le texte complet (un `aria-label` sur un `span` n'est pas lu).
 ********************************************************/
const props = withDefaults(defineProps<IEditionChipProps>(), { srText: undefined })
const emits = defineEmits<{}>()
defineSlots<{}>()
const chipProps = computed(() => EDITION_CHIP_PROPS[props.family])

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>
