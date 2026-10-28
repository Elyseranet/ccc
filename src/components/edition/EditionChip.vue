
<template>
  <origam-chip
    v-bind="chipProps"
    :text="text"
    class="edition-chip"
  />
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
 ********************************************************/
const props = withDefaults(defineProps<IEditionChipProps>(), {})
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
